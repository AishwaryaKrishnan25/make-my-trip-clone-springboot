package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.Flight;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FlightRepository extends MongoRepository<Flight, String> {
}
