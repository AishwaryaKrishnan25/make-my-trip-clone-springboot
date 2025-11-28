package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Seat;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple thread-safe SeatService for development/testing.
 * - stores seats in-memory
 * - provides getSeatMap, saveSeat, reserveSeat, releaseSeat
 *
 * Replace with DB-backed implementation in production.
 */
@Service
public class SeatService {

	// seatId -> Seat
	private final ConcurrentHashMap<String, Seat> seatsById = new ConcurrentHashMap<>();

	// flightId -> set of seatIds (index)
	private final ConcurrentHashMap<String, Set<String>> seatsByFlight = new ConcurrentHashMap<>();

	public SeatService() {
		// optional: initial seeding can be done by controller when no seats found
	}

	// Return list of seats for flight (snapshot)
	public List<Seat> getSeatMap(String flightId) {
		if (flightId == null) return Collections.emptyList();
		Set<String> ids = seatsByFlight.getOrDefault(flightId, Collections.emptySet());
		List<Seat> list = new ArrayList<>();
		for (String id : ids) {
			Seat s = seatsById.get(id);
			if (s != null) list.add(copySeat(s));
		}
		// sort by row then col for deterministic UI
		list.sort(Comparator.comparing(Seat::getRow, Comparator.nullsFirst(String::compareTo))
				.thenComparing(Seat::getCol, Comparator.nullsFirst(String::compareTo)));
		return list;
	}

	// Save or update a seat (persist in-memory)
	public Seat saveSeat(Seat seat) {
		if (seat == null || seat.getId() == null) return null;
		seatsById.put(seat.getId(), deepCopySeat(seat));
		seatsByFlight.computeIfAbsent(seat.getFlightId(), k -> Collections.newSetFromMap(new ConcurrentHashMap<>()))
		.add(seat.getId());
		return copySeat(seat);
	}

	// Reserve seat: thread-safe per-seat
	public Seat reserveSeat(String seatId, String userId) {
		if (seatId == null || userId == null) throw new IllegalArgumentException("seatId and userId required");

		// synchronize on interned seatId string to guard concurrent reservations for same seat
		synchronized (seatId.intern()) {
			Seat s = seatsById.get(seatId);
			if (s == null) throw new IllegalStateException("Seat not found");

			if (Boolean.TRUE.equals(s.getReserved())) {
				// already reserved
				if (userId.equals(s.getReservedBy())) {
					// idempotent: already reserved by same user
					return copySeat(s);
				}
				throw new IllegalStateException("Seat already reserved by another user");
			}

			// mark reserved
			s.setReserved(true);
			s.setReservedBy(userId);
			seatsById.put(seatId, deepCopySeat(s));
			return copySeat(s);
		}
	}

	// Release seat: only by same user
	public Seat releaseSeat(String seatId, String userId) {
		if (seatId == null || userId == null) throw new IllegalArgumentException("seatId and userId required");

		synchronized (seatId.intern()) {
			Seat s = seatsById.get(seatId);
			if (s == null) throw new IllegalStateException("Seat not found");

			if (!Boolean.TRUE.equals(s.getReserved())) {
				throw new IllegalStateException("Seat is not reserved");
			}
			if (!userId.equals(s.getReservedBy())) {
				throw new IllegalStateException("Seat reserved by another user");
			}

			// release
			s.setReserved(false);
			s.setReservedBy(null);
			seatsById.put(seatId, deepCopySeat(s));
			return copySeat(s);
		}
	}

	private Seat copySeat(Seat s) {
		if (s == null) return null;
		Seat c = new Seat();

		c.setId(s.getId());
		c.setFlightId(s.getFlightId());
		c.setRow(s.getRow());
		c.setCol(s.getCol());
		c.setCategory(s.getCategory());

		c.setWindow(s.isWindow());
		c.setAisle(s.isAisle());
		c.setReserved(s.isReserved());
		c.setReservedBy(s.getReservedBy());

		// 🔥 These were missing!
		c.setPremium(s.isPremium());
		c.setPremiumPrice(s.getPremiumPrice());

		c.setUpsellPrice(s.getUpsellPrice());
		c.setNotes(s.getNotes());

		return c;
	}


	// copy before storing to keep internal map separate
	private Seat deepCopySeat(Seat s) {
		return copySeat(s);
	}
}
