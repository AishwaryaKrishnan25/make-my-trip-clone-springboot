package com.makemytrip.makemytrip.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Hotel;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.HotelRepository;
import java.util.List;

@RestController
@CrossOrigin(origins = "*")
public class RootController {
    @Autowired
    private HotelRepository hotelRepository;

    @Autowired
    private FlightRepository flightRepository;

    @GetMapping("/")
    public String home() { return "Running"; }

    @GetMapping("/hotel")
    public ResponseEntity<List<Hotel>> getAllHotels(){ return ResponseEntity.ok(hotelRepository.findAll()); }

    @GetMapping("/flight")
    public ResponseEntity<List<Flight>> getAllFlights(){ return ResponseEntity.ok(flightRepository.findAll()); }
}
