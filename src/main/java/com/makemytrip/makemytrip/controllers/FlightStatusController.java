package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.FlightStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;

@RestController
@RequestMapping("/api/flight-status")
@CrossOrigin(origins = "*")
public class FlightStatusController {

    private final Map<String, FlightStatus> statusMap = new ConcurrentHashMap<>();
    private final Map<String, List<SseEmitter>> subscribers = new ConcurrentHashMap<>();

    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor();

    private final List<String> reasons = Arrays.asList(
            "Weather delay",
            "Air Traffic Congestion",
            "Technical inspection",
            "Crew rest requirement",
            "Runway maintenance"
    );

    public FlightStatusController() {
        scheduler.scheduleAtFixedRate(this::autoUpdate, 10, 15, TimeUnit.SECONDS);
    }

    private FlightStatus createIfMissing(String flightId) {
        return statusMap.computeIfAbsent(flightId, id ->
                new FlightStatus(
                        id,
                        "Flight " + id,
                        "ON_TIME",
                        0,
                        null,
                        LocalDateTime.now().plusHours(2),
                        LocalDateTime.now()
                )
        );
    }

    @GetMapping("/{flightId}")
    public FlightStatus getStatus(@PathVariable String flightId) {
        return createIfMissing(flightId);
    }

    @PostMapping("/{flightId}")
    public FlightStatus updateStatus(@PathVariable String flightId, @RequestBody FlightStatus updated) {
        updated.setFlightId(flightId);
        updated.setLastUpdated(LocalDateTime.now());
        statusMap.put(flightId, updated);

        broadcast(flightId, "update", updated);
        return updated;
    }

    @GetMapping(value = "/stream/{flightId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable String flightId) {

        FlightStatus status = createIfMissing(flightId);

        SseEmitter emitter = new SseEmitter(0L);

        subscribers.computeIfAbsent(flightId, id -> new CopyOnWriteArrayList<>()).add(emitter);

        try {
            emitter.send(SseEmitter.event().name("init").data(status));
        } catch (Exception ignored) {}

        emitter.onCompletion(() -> remove(flightId, emitter));
        emitter.onTimeout(() -> remove(flightId, emitter));
        emitter.onError(e -> remove(flightId, emitter));

        return emitter;
    }

    private void remove(String id, SseEmitter em) {
        subscribers.getOrDefault(id, new ArrayList<>()).remove(em);
    }

    private void broadcast(String id, String type, Object data) {
        List<SseEmitter> list = subscribers.get(id);

        if (list == null) return;

        List<SseEmitter> dead = new ArrayList<>();

        for (SseEmitter emitter : list) {
            try {
                emitter.send(SseEmitter.event().name(type).data(data));
            } catch (Exception e) {
                dead.add(emitter);
            }
        }

        list.removeAll(dead);
    }

    private void autoUpdate() {
        statusMap.values().forEach(s -> {

            boolean shouldDelay = new Random().nextDouble() < 0.35; // 35% chance

            if (!shouldDelay) return;

            long delay = 15 + new Random().nextInt(40);

            s.setStatus("DELAYED");
            s.setDelayMinutes(delay);
            s.setDelayReason(reasons.get(new Random().nextInt(reasons.size())));
            s.setEstimatedArrival(s.getEstimatedArrival().plusMinutes(delay));
            s.setLastUpdated(LocalDateTime.now());

            broadcast(s.getFlightId(), "update", s);
        });
    }
}
