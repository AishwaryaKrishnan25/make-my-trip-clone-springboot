package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.FlightStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

@Service
public class FlightStatusService {

    private final Map<String, FlightStatus> statuses = new ConcurrentHashMap<>();
    private final Map<String, List<SseEmitter>> clients = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    private final List<String> delayReasons = Arrays.asList(
            "Weather issues",
            "Technical inspection",
            "Air traffic congestion",
            "Crew rest requirements",
            "Runway maintenance",
            "Security checks"
    );

    public FlightStatusService() {
        scheduler.scheduleAtFixedRate(this::autoUpdateLoop, 10, 15, TimeUnit.SECONDS);
    }

    public FlightStatus getStatus(String flightId) {
        return statuses.computeIfAbsent(flightId, id -> new FlightStatus(
                id,
                "Flight " + id,
                "ON_TIME",
                0,
                null,
                LocalDateTime.now().plusHours(2),
                LocalDateTime.now()
        ));
    }

    public FlightStatus updateStatus(String flightId, FlightStatus newStatus) {
        newStatus.setLastUpdated(LocalDateTime.now());
        statuses.put(flightId, newStatus);
        broadcast(flightId, "update", newStatus);
        return newStatus;
    }

    private void autoUpdateLoop() {
        statuses.values().forEach(status -> {
            boolean shouldDelay = Math.random() < 0.3;

            if (shouldDelay) {
                int minutes = 10 + new Random().nextInt(41);
                String reason = delayReasons.get(new Random().nextInt(delayReasons.size()));

                status.setStatus("DELAYED");
                status.setDelayMinutes(minutes);
                status.setDelayReason(reason);
                status.setEstimatedArrival(status.getEstimatedArrival().plusMinutes(minutes));
                status.setLastUpdated(LocalDateTime.now());

                broadcast(status.getFlightId(), "update", status);
            }
        });
    }

    public SseEmitter registerClient(String flightId) {
        SseEmitter emitter = new SseEmitter(0L);

        clients.computeIfAbsent(flightId, id -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onTimeout(() -> removeEmitter(flightId, emitter));
        emitter.onCompletion(() -> removeEmitter(flightId, emitter));
        emitter.onError((e) -> removeEmitter(flightId, emitter));

        try {
            FlightStatus status = getStatus(flightId);
            emitter.send(SseEmitter.event()
                    .name("init")
                    .data(status));
        } catch (Exception ignore) {}

        return emitter;
    }

    private void removeEmitter(String flightId, SseEmitter emitter) {
        clients.computeIfPresent(flightId, (id, list) -> {
            list.remove(emitter);
            return list;
        });
    }

    private void broadcast(String flightId, String eventName, Object data) {
        List<SseEmitter> list = clients.get(flightId);
        if (list == null) return;

        List<SseEmitter> dead = new ArrayList<>();

        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event()
                        .name(eventName)
                        .data(data));
            } catch (Exception e) {
                dead.add(emitter);
            }
        }

        list.removeAll(dead);
    }
}
