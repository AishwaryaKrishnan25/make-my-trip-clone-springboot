package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Booking;
import com.makemytrip.makemytrip.services.BookingService;
import com.makemytrip.makemytrip.repositories.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    @Autowired
    private BookingRepository bookingRepository;

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Booking>> getUserBookings(@PathVariable String userId){
        return ResponseEntity.ok(bookingRepository.findByUserId(userId));
    }

    @PostMapping("/flight")
    public ResponseEntity<Booking> bookFlight(@RequestParam String userId,@RequestParam String flightId,@RequestParam int seats,@RequestParam double price){
        Booking b = bookingService.bookFlight(userId, flightId, seats, price);
        return ResponseEntity.ok(b);
    }

    @PostMapping("/hotel")
    public ResponseEntity<Booking> bookHotel(@RequestParam String userId,@RequestParam String hotelId,@RequestParam int rooms,@RequestParam double price){
        Booking b = bookingService.bookHotel(userId, hotelId, rooms, price);
        return ResponseEntity.ok(b);
    }
}
