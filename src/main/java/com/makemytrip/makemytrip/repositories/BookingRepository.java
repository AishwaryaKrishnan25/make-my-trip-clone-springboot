package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {

    List<Booking> findByUserId(String userId);

    // used by pricing / analytics if needed
    List<Booking> findByBookingTypeAndBookingRefAndBookingTimeAfter(
            String bookingType,
            String bookingRef,
            LocalDateTime after
    );
}
