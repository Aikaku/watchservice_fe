package com.watchserviceagent.watchservice_agent.service.watcher;

import com.watchserviceagent.watchservice_agent.dto.common.WatchEventRecord;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.CopyOnWriteArrayList;

import static java.nio.file.StandardWatchEventKinds.*;

/**
 * 클래스 이름 : WatcherService
 * 기능 : 사용자가 지정한 디렉토리를 감시하고 CREATE/MODIFY/DELETE 이벤트를
 *       WatchEventRecord DTO로 변환하여 JSON 형태로 로그에 출력한다.
 *       또한, 감시 도중 생성된 하위 폴더를 자동으로 감시 대상에 추가한다.
 * 작성 날짜 : 2025/11/05
 * 작성자 : 이상혁
 */
@Service
@Slf4j
public class WatcherService {

    private ExecutorService executor;   // 감시 전용 스레드 풀
    private WatchService watchService;  // NIO WatchService
    private Path watchPath;             // 감시 루트 경로
    private volatile boolean stopRequested = false; // ✅ 감시 중지 요청 플래그
    
    // 동시성 제어를 위한 락
    private final Object lock = new Object();
    
    // 이벤트 저장소 (최대 1000개, Thread-safe)
    private final List<WatchEventRecord> events = new CopyOnWriteArrayList<>();
    private static final int MAX_EVENTS = 1000;

    /**
     * 감시 시작
     * @param folderPath 감시할 폴더 경로
     */
    public void startWatching(String folderPath) throws IOException {
        synchronized (lock) {
            // 이미 실행 중인 경우 경고 후 종료
            if (executor != null && !executor.isShutdown()) {
                log.warn("Watcher is already running for {}", watchPath);
                return;
            }

            // 이전 리소스가 남아있으면 정리
            cleanupResources();
            // 이벤트 리스트 초기화
            events.clear();

            // 사용자가 지정한 경로를 감시 경로 객체로 지정
            this.watchPath = Paths.get(folderPath).toAbsolutePath();

            // 사용자가 지정한 경로가 존재하지 않는 경우 예외 처리
            if (!Files.exists(watchPath)) {
                throw new IllegalArgumentException("지정한 경로가 존재하지 않습니다: " + folderPath);
            }

            // 운영체제 파일 감시기를 생성 및 객체에 대입
            this.watchService = FileSystems.getDefault().newWatchService();
            // 감시 전용 스레드를 싱글톤 스레드로 지정
            this.executor = Executors.newSingleThreadExecutor();
            // 감시 중지 플래그 초기화
            this.stopRequested = false;

            // 루트 및 모든 하위 디렉토리 등록
            registerAll(watchPath);
            
            // 감시 루프 시작
            executor.submit(() -> {
            log.info("Watcher started for {}", watchPath.toAbsolutePath());
            try {
                while (!stopRequested) {
                    WatchKey key;
                    try {
                        // 이벤트 대기 (Blocking)
                        key = watchService.take();
                    } catch (InterruptedException e) {
                        // 인터럽트 발생 시 루프 종료
                        Thread.currentThread().interrupt();
                        break;
                    } catch (ClosedWatchServiceException e) {
                        // 감시 서비스 종료 시 루프 종료
                        log.info("WatchService closed");
                        break;
                    }

                    // 이벤트가 발생한 디렉토리 경로
                    Path dir = (Path) key.watchable();

                    // 발생한 이벤트 순회
                    for (WatchEvent<?> event : key.pollEvents()) {
                        Path changed = dir.resolve((Path) event.context());

                        // DTO 객체 생성 (CREATE / MODIFY / DELETE)
                        WatchEventRecord record = new WatchEventRecord(
                                event.kind().name().replace("ENTRY_", ""), // CREATE / MODIFY / DELETE
                                changed.toString(),                         // 파일/폴더 경로
                                Instant.now()                               // 이벤트 발생 시각
                        );

                        // JSON 직렬화된 문자열을 로그에 출력
                        log.info("File event detected: {}", record.toString());
                        
                        // 이벤트를 메모리에 저장 (실시간 표시용)
                        addEvent(record);
                        log.debug("Event saved. Total events: {}", events.size());

                        // 새 폴더 생성 시 하위 디렉토리 자동 등록
                        if (event.kind() == ENTRY_CREATE) {
                            try {
                                if (Files.isDirectory(changed)) {
                                    registerAll(changed);
                                    log.info("New subdirectory registered: {}", changed.toAbsolutePath());
                                }
                            } catch (IOException e) {
                                log.error("Failed to register new directory: {}", e.getMessage());
                            }
                        }
                    }

                    // 유효하지 않은 키는 감시 중지
                    if (!key.reset()) {
                        log.warn("WatchKey invalid, stopping watcher");
                        break;
                    }
                }
            } finally {
                log.info("Watcher loop ended.");
            }
            });
        }
    }

    /**
     * 지정된 경로와 그 하위의 모든 디렉토리를 재귀적으로 WatchService에 등록
     */
    private void registerAll(Path start) throws IOException {
        Files.walkFileTree(start, new SimpleFileVisitor<Path>() {
            @Override
            public FileVisitResult preVisitDirectory(Path dir, BasicFileAttributes attrs) throws IOException {
                dir.register(watchService, ENTRY_CREATE, ENTRY_MODIFY, ENTRY_DELETE);
                log.info("Registered directory: {}", dir.toAbsolutePath());
                return FileVisitResult.CONTINUE;
            }
        });
    }

    /**
     * 감시 중지
     */
    public void stopWatching() throws IOException {
        synchronized (lock) {
            log.info("Stopping watcher...");
            
            // 감시 중지 요청 플래그 활성화
            stopRequested = true;

            cleanupResources();

            log.info("Watcher stopped for {}", watchPath != null ? watchPath.toAbsolutePath() : "unknown");
        }
    }

    /**
     * 현재 감시 상태 조회
     * @return 감시 중인 경로 (감시 중이 아니면 null)
     */
    public String getCurrentWatchPath() {
        synchronized (lock) {
            if (executor != null && !executor.isShutdown() && watchPath != null) {
                return watchPath.toString();
            }
            return null;
        }
    }

    /**
     * 감시 중인지 여부 확인
     * @return 감시 중이면 true
     */
    public boolean isWatching() {
        synchronized (lock) {
            return executor != null && !executor.isShutdown();
        }
    }

    /**
     * 이벤트 추가 (최대 개수 제한)
     */
    private void addEvent(WatchEventRecord event) {
        synchronized (events) {
            events.add(event);
            log.info("Event added: {} - Total events: {}", event.getEventType(), events.size());
            // 최대 개수 초과 시 가장 오래된 이벤트 제거
            if (events.size() > MAX_EVENTS) {
                events.remove(0);
            }
        }
    }

    /**
     * 저장된 이벤트 목록 조회 (최신순)
     * @return 이벤트 목록
     */
    public List<WatchEventRecord> getEvents() {
        synchronized (events) {
            List<WatchEventRecord> result = new ArrayList<>(events);
            Collections.reverse(result); // 최신순으로 반환
            return result;
        }
    }

    /**
     * 저장된 이벤트 개수 조회
     * @return 이벤트 개수
     */
    public int getEventCount() {
        return events.size();
    }

    /**
     * 리소스 정리 메서드
     */
    private void cleanupResources() {
        // WatchService 자원 해제 및 Blocking 해제 시도
        if (watchService != null) {
            try {
                watchService.close();
            } catch (IOException e) {
                log.error("Error closing WatchService", e);
            }
            watchService = null;
        }

        // 감시 스레드 종료
        if (executor != null && !executor.isShutdown()) {
            executor.shutdownNow();
            try {
                // 최대 5초 대기 후 강제 종료
                if (!executor.awaitTermination(5, java.util.concurrent.TimeUnit.SECONDS)) {
                    log.warn("Executor did not terminate in time");
                }
            } catch (InterruptedException e) {
                executor.shutdownNow();
                Thread.currentThread().interrupt();
            }
            executor = null;
        }
    }
}
