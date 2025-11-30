package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.models.Booking;
import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Hotel;
import com.makemytrip.makemytrip.repositories.UserRepository;
import com.makemytrip.makemytrip.repositories.BookingRepository;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.HotelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class BookingService {

	@Autowired
	private UserRepository userRepo;

	@Autowired
	private FlightRepository flightRepo;

	@Autowired
	private HotelRepository hotelRepo;

	@Autowired
	private BookingRepository bookingRepo;

	public Booking bookFlight(String userId, String flightId, int seats, double price,
			String seatId, Double seatPrice) {

		Booking booking = new Booking();
		booking.setUserId(userId);
		booking.setSeats(seats);
		booking.setBookingType("FLIGHT");
		booking.setBookingRef(flightId);
		booking.setSeats(seats);
		booking.setTotalAmount(price);
		booking.setStatus("CONFIRMED");
		booking.setBookingTime(LocalDateTime.now());

		booking.setSeatId(seatId);
		booking.setSeatPrice(seatPrice != null ? seatPrice : 0.0);

		return bookingRepo.save(booking);
	}

	public Booking bookHotel(String userId, String hotelId, int rooms, double price) {
		Users user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
		Hotel hotel = hotelRepo.findById(hotelId).orElseThrow(() -> new RuntimeException("Hotel not found"));

		if (hotel.getAvailableRooms() < rooms) throw new RuntimeException("Not enough rooms");
		hotel.setAvailableRooms(hotel.getAvailableRooms() - rooms);
		hotelRepo.save(hotel);

		Booking booking = new Booking();
		booking.setUserId(userId);
		booking.setBookingType("HOTEL");
		booking.setBookingRef(hotelId);
		booking.setTotalAmount(price);
		booking.setBookingTime(LocalDateTime.now());
		booking.setStatus("CONFIRMED");

		bookingRepo.save(booking);
		user.getBookingIds().add(booking.getId());
		userRepo.save(user);

		return booking;
	}
}
