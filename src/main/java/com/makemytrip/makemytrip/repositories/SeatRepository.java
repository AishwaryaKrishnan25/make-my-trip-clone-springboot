package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.Seat;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface SeatRepository extends MongoRepository<Seat, String> {
    List<Seat> findByFlightId(String flightId);
}
