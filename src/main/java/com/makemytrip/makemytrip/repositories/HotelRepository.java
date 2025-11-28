package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.Hotel;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HotelRepository extends MongoRepository<Hotel, String> {
}
