package com.example.watchservicebeta.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.nio.file.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.Executors;

import static java.nio.file.StandardWatchEventKinds.*;

@Service
public class FileWatchService {

    private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

    // SSE 구독자 등록
    public SseEmitter registerEmitter() {
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        emitters.add(emitter);
        emitter.onCompletion(() -> emitters.remove(emitter));
        emitter.onTimeout(() -> emitters.remove(emitter));
        return emitter;
    }

    @PostConstruct
    public void startWatching() throws Exception {
        Path path = Paths.get("C:/Users/me/Documents"); // 감시할 경로 바꿔도 됨
        WatchService watchService = FileSystems.getDefault().newWatchService();
        path.register(watchService, ENTRY_CREATE, ENTRY_DELETE, ENTRY_MODIFY);

        Executors.newSingleThreadExecutor().submit(() -> {
            try {
                while (true) {
                    WatchKey key = watchService.take();
                    for (WatchEvent<?> event : key.pollEvents()) {
                        String message = String.format("📂 이벤트: %s → %s",
                                event.kind().name(),
                                event.context());
                        System.out.println(message);

                        // 실시간 구독자에게 전송
                        for (SseEmitter emitter : emitters) {
                            try {
                                emitter.send(SseEmitter.event().data(message));
                            } catch (Exception e) {
                                emitters.remove(emitter);
                            }
                        }
                    }
                    key.reset();
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        });
    }
}
