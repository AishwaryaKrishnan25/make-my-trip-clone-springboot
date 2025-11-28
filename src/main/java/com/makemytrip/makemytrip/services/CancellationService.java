package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Booking;
import com.makemytrip.makemytrip.models.Refund;
import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Hotel;
import com.makemytrip.makemytrip.repositories.BookingRepository;
import com.makemytrip.makemytrip.repositories.RefundRepository;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.HotelRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Optional;

@Service
public class CancellationService {

    @Autowired
    private BookingRepository bookingRepo;

    @Autowired
    private RefundRepository refundRepo;

    @Autowired
    private FlightRepository flightRepo;

    @Autowired
    private HotelRepository hotelRepo;

    public Booking cancelBooking(String bookingId, String reason) {

        Booking booking = bookingRepo.findById(bookingId)
                .orElseThrow(() -> new IllegalArgumentException("Booking not found"));

        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            return booking;
        }

        String type = booking.getBookingType() == null
                ? ""
                : booking.getBookingType().toUpperCase();

        double refundAmount;

        switch (type) {
            case "FLIGHT":
                refundAmount = computeFlightRefund(booking);
                break;

            case "HOTEL":
                refundAmount = computeHotelRefund(booking);
                break;

            default:
                refundAmount = computeGenericRefund(booking);
                break;
        }

        booking.setStatus("CANCELLED");
        booking.setCancellationReason(reason);
        booking.setCancellationTime(LocalDateTime.now());
        booking.setRefundAmount(refundAmount);
        booking.setRefundStatus("PENDING");
        bookingRepo.save(booking);

        Refund refund = new Refund();
        refund.setBookingId(booking.getId());
        refund.setRefundAmount(refundAmount);
        refund.setStatus("PENDING");
        refund.setInitiatedAt(LocalDateTime.now());
        refundRepo.save(refund);

        processRefund(refund.getId());

        return booking;
    }

    /* ---------------------------------------------------
     *  UNIVERSAL RULE APPLIED TO FLIGHT AND HOTEL:
     * ---------------------------------------------------
     * 1. Cancel within 24 hours of booking → 100%
     * 2. Cancel after 24h but before travel → 50%
     * 3. Cancel on the same day of travel → 0%
     * 4. After departure/check-in → Cannot cancel
     * ---------------------------------------------------
     */

    private double computeFlightRefund(Booking booking) {
        String flightId = booking.getBookingRef();

        if (flightId == null || flightId.isBlank()) {
            return computeGenericRefund(booking);
        }

        Optional<Flight> fOpt = flightRepo.findById(flightId);
        if (fOpt.isEmpty()) return computeGenericRefund(booking);

        Flight flight = fOpt.get();
        String depStr = flight.getDepartureTime();

        if (depStr == null || depStr.isBlank()) {
            return computeGenericRefund(booking);
        }

        try {
            LocalDateTime departure = LocalDateTime.parse(depStr);
            return computeRefundBasedOnTime(booking, departure);

        } catch (Exception e) {
            return computeGenericRefund(booking);
        }
    }

    private double computeHotelRefund(Booking booking) {
        String hotelId = booking.getBookingRef();

        if (hotelId == null || hotelId.isBlank()) {
            return computeGenericRefund(booking);
        }

        Optional<Hotel> hOpt = hotelRepo.findById(hotelId);
        if (hOpt.isEmpty()) return computeGenericRefund(booking);

        Hotel hotel = hOpt.get();
        String checkInStr = hotel.getCheckInTime();

        if (checkInStr == null || checkInStr.isBlank()) {
            return computeGenericRefund(booking);
        }

        try {
            LocalDateTime checkIn = LocalDateTime.parse(checkInStr);
            return computeRefundBasedOnTime(booking, checkIn);

        } catch (Exception e) {
            return computeGenericRefund(booking);
        }
    }

    /* ------------------------------
     * MASTER REFUND TIME LOGIC
     * ------------------------------
     */
    private double computeRefundBasedOnTime(Booking booking, LocalDateTime eventTime) {

        // Convert booking time (stored UTC) into system default timezone
        ZonedDateTime bookingZDT = booking.getBookingTime().atZone(ZoneId.of("UTC"))
                .withZoneSameInstant(ZoneId.systemDefault());

        ZonedDateTime nowZDT = LocalDateTime.now().atZone(ZoneId.systemDefault());
        ZonedDateTime eventZDT = eventTime.atZone(ZoneId.of("UTC"))
                .withZoneSameInstant(ZoneId.systemDefault());

        long hoursSinceBooking = Duration.between(bookingZDT, nowZDT).toHours();

        if (nowZDT.isAfter(eventZDT)) {
            throw new IllegalArgumentException("Cannot cancel after travel/check-in time.");
        }

        // Rule 1: within 24 hours of booking → 100%
        if (hoursSinceBooking <= 24) {
            return booking.getTotalAmount();
        }

        // Rule 2: cancellation on the day of travel/check-in → 0%
        if (nowZDT.toLocalDate().isEqual(eventZDT.toLocalDate())) {
            return 0.0;
        }

        // Rule 3: after 24 hours but before event → 50%
        return booking.getTotalAmount() * 0.5;
    }

    /* Fallback if data is missing */
    private double computeGenericRefund(Booking booking) {

        ZonedDateTime bookingZDT = booking.getBookingTime().atZone(ZoneId.of("UTC"))
                .withZoneSameInstant(ZoneId.systemDefault());

        ZonedDateTime nowZDT = LocalDateTime.now().atZone(ZoneId.systemDefault());

        long hours = Duration.between(bookingZDT, nowZDT).toHours();

        if (hours <= 24) return booking.getTotalAmount();

        return booking.getTotalAmount() * 0.5;
    }

    private void processRefund(String refundId) {
        Refund r = refundRepo.findById(refundId).orElse(null);
        if (r == null) return;

        try {
            r.setStatus("COMPLETED");
            r.setCompletedAt(LocalDateTime.now());
            refundRepo.save(r);

            Booking booking = bookingRepo.findById(r.getBookingId()).orElse(null);
            if (booking != null) {
                booking.setRefundStatus("COMPLETED");
                bookingRepo.save(booking);
            }
        } catch (Exception e) {
            r.setStatus("FAILED");
            refundRepo.save(r);
        }
    }
}
