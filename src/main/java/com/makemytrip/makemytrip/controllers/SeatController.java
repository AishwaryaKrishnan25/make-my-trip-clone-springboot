package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Seat;
import com.makemytrip.makemytrip.services.SeatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.*;
import java.util.concurrent.*;


@RestController
@RequestMapping("/api/seats")
@CrossOrigin(origins = "*")
public class SeatController {

	@Autowired
	private SeatService seatService;

	// keep emitters per flight
	private final Map<String, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

	// simple executor for periodic tasks (if any)
	private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

	/**
	 * Return seat map for a flight.
	 */
	@GetMapping("/flight/{flightId}")
	public ResponseEntity<List<Seat>> getSeatMap(@PathVariable String flightId) {
		List<Seat> seats = seatService.getSeatMap(flightId);
		// if empty, seed a default mock layout (example)
		if (seats == null || seats.isEmpty()) {
			seats = seedDefaultMockLayout(flightId);
		}
		return ResponseEntity.ok(seats);
	}

	/**
	 * Reserve a seat.
	 * POST /api/seats/{seatId}/reserve?userId=...
	 */
	@PostMapping("/{seatId}/reserve")
	public ResponseEntity<?> reserveSeat(@PathVariable String seatId,
			@RequestParam(name = "userId", required = true) String userId) {
		if (seatId == null || seatId.isEmpty()) {
			return ResponseEntity.badRequest().body("seatId required");
		}
		if (userId == null || userId.isEmpty()) {
			return ResponseEntity.badRequest().body("userId required");
		}

		try {
			Seat updated = seatService.reserveSeat(seatId, userId);
			if (updated == null) {
				return ResponseEntity.status(404).body("Seat not found or cannot be reserved");
			}
			// broadcast to SSE clients watching this flight
			if (updated.getFlightId() != null) {
				broadcastToFlight(updated.getFlightId(), updated);
			}
			return ResponseEntity.ok(updated);
		} catch (IllegalStateException ise) {
			// conflict or already reserved by another user
			return ResponseEntity.status(409).body(ise.getMessage());
		} catch (Exception ex) {
			ex.printStackTrace();
			return ResponseEntity.status(500).body("Failed to reserve seat: " + ex.getMessage());
		}
	}

	/**
	 * Release a seat.
	 * POST /api/seats/{seatId}/release?userId=...
	 */
	@PostMapping("/{seatId}/release")
	public ResponseEntity<?> releaseSeat(@PathVariable String seatId,
			@RequestParam(name = "userId", required = true) String userId) {
		if (seatId == null || seatId.isEmpty()) {
			return ResponseEntity.badRequest().body("seatId required");
		}
		if (userId == null || userId.isEmpty()) {
			return ResponseEntity.badRequest().body("userId required");
		}

		try {
			Seat updated = seatService.releaseSeat(seatId, userId);
			if (updated == null) {
				return ResponseEntity.status(404).body("Seat not found or cannot be released");
			}
			if (updated.getFlightId() != null) {
				broadcastToFlight(updated.getFlightId(), updated);
			}
			return ResponseEntity.ok(updated);
		} catch (IllegalStateException ise) {
			return ResponseEntity.status(409).body(ise.getMessage());
		} catch (Exception ex) {
			ex.printStackTrace();
			return ResponseEntity.status(500).body("Failed to release seat: " + ex.getMessage());
		}
	}

	/**
	 * SSE: connect to receive seat updates for a flight
	 * GET /api/seats/stream/{flightId}
	 */
	@GetMapping(value = "/stream/{flightId}", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
	public SseEmitter streamSeats(@PathVariable String flightId) {
		SseEmitter emitter = new SseEmitter(0L);
		emitters.computeIfAbsent(flightId, k -> Collections.newSetFromMap(new ConcurrentHashMap<>())).add(emitter);

		// send initial map
		try {
			List<Seat> seats = seatService.getSeatMap(flightId);
			if (seats == null || seats.isEmpty()) seats = seedDefaultMockLayout(flightId);
			emitter.send(SseEmitter.event().name("init").data(seats));
		} catch (Exception ex) {
			// ignore initial send errors
		}

		emitter.onCompletion(() -> {
			Set<SseEmitter> s = emitters.getOrDefault(flightId, Collections.emptySet());
			s.remove(emitter);
		});
		emitter.onTimeout(() -> {
			Set<SseEmitter> s = emitters.getOrDefault(flightId, Collections.emptySet());
			s.remove(emitter);
		});
		emitter.onError((e) -> {
			Set<SseEmitter> s = emitters.getOrDefault(flightId, Collections.emptySet());
			s.remove(emitter);
		});

		return emitter;
	}

	private void broadcastToFlight(String flightId, Object obj) {
		Set<SseEmitter> set = emitters.getOrDefault(flightId, Collections.emptySet());
		for (SseEmitter em : new HashSet<>(set)) {
			try {
				em.send(SseEmitter.event().name("update").data(obj));
			} catch (Exception ex) {
				try { em.complete(); } catch (Exception ignore) {}
				set.remove(em);
			}
		}
	}

	// Seed a simple mock layout (rows 1..20, cols A-F) — replace with real data in production
	private List<Seat> seedDefaultMockLayout(String flightId) {
		List<Seat> list = new ArrayList<>();
		String[] cols = new String[] {"A","B","C","D","E","F"};
		for (int r = 1; r <= 20; r++) {
			for (int c = 0; c < cols.length; c++) {
				Seat s = new Seat();
				s.setId(flightId + "-" + r + cols[c]);
				s.setFlightId(flightId);
				s.setRow(String.valueOf(r));
				s.setCol(cols[c]);
				s.setCategory(r <= 2 ? "BUSINESS" : (r <= 5 ? "PREMIUM" : "ECONOMY"));
				s.setWindow(cols[c].equals("A") || cols[c].equals("F"));
				s.setAisle(cols[c].equals("C") || cols[c].equals("D"));
				s.setReserved(false);
				s.setReservedBy(null);
				double price = s.getCategory().equals("PREMIUM") ? 25.0 :
					s.getCategory().equals("BUSINESS") ? 75.0 : 0.0;

				s.setPremium(s.getCategory().equals("PREMIUM") || s.getCategory().equals("BUSINESS"));
				s.setPremiumPrice(price);
				s.setUpsellPrice(price); // still keep for compatibility

				try {
					seatService.saveSeat(s);
				} catch (Exception ex) {
					// ignore save errors for seeding
				}
				list.add(s);
			}
		}
		return list;
	}

	public ScheduledExecutorService getScheduler() {
		return scheduler;
	}
}
