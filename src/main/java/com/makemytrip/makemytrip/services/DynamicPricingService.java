package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Booking;
import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.PriceHistory;
import com.makemytrip.makemytrip.repositories.BookingRepository;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.PriceHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * DynamicPricingService
 *
 * Runs periodically and adjusts flight prices based on:
 *  - Holiday surcharges (e.g. +20% on selected dates)
 *  - Recent demand (number of bookings in last N days)
 *  - Respects "price freeze" (priceFreezeUntil) on flights
 *
 * Every time the current price changes, a PriceHistory entry is stored.
 */
@Service
public class DynamicPricingService {

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private PriceHistoryRepository priceHistoryRepository;

    /**
     * Static list of holidays (MM-dd) where extra surcharge is applied.
     * You can customize this list for your use case.
     */
    private final Set<String> holidays = new HashSet<>(Arrays.asList(
            "01-01", // New Year
            "08-15", // Independence Day
            "10-02", // Gandhi Jayanti
            "12-25"  // Christmas
    ));

    /**
     * Runs every 5 minutes (300000 ms).
     * Adjust as needed – could be 1 min, 10 min, hourly etc.
     */
    @Scheduled(fixedRate = 300000)
    public void evaluateAndAdjustPrices() {
        try {
            LocalDate today = LocalDate.now();
            String todayKey = String.format("%02d-%02d", today.getMonthValue(), today.getDayOfMonth());
            boolean isHoliday = holidays.contains(todayKey);

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime weekAgo = now.minusDays(7);

            List<Flight> flights = flightRepository.findAll();

            for (Flight flight : flights) {
                double basePrice = flight.getBasePrice();
                if (basePrice <= 0.0) {
                    // no base price set, skip
                    continue;
                }

                // 1) Respect price freeze: do not change price if freeze is active
                if (flight.getPriceFreezeUntil() != null) {
                    Date freezeUntil = flight.getPriceFreezeUntil();
                    if (freezeUntil.after(new Date())) {
                        // still frozen, skip this flight
                        continue;
                    }
                }

                double newPrice = calculateDynamicPriceForFlight(flight, basePrice, isHoliday, weekAgo, now);
                newPrice = roundToCents(newPrice);

                double oldPrice = flight.getCurrentPrice();
                if (oldPrice <= 0.0) {
                    oldPrice = basePrice; // if not set, treat as base
                }

                // Only update & log if there is a significant change
                if (Math.abs(newPrice - oldPrice) > 0.01) {
                    flight.setCurrentPrice(newPrice);
                    flightRepository.save(flight);

                    String reason = buildReasonForChange(flight, basePrice, newPrice, isHoliday, weekAgo, now);
                    PriceHistory history = new PriceHistory(
                            "flight",
                            flight.getId(),
                            newPrice,
                            new Date(),
                            reason
                    );
                    priceHistoryRepository.save(history);
                }
            }
        } catch (Exception ex) {
            System.err.println("DynamicPricingService.evaluateAndAdjustPrices failed: " + ex.getMessage());
            ex.printStackTrace();
        }
    }

    /**
     * Calculates dynamic price based on:
     *  - base price
     *  - holiday factor
     *  - demand factor (recent bookings)
     */
    private double calculateDynamicPriceForFlight(
            Flight flight,
            double basePrice,
            boolean isHoliday,
            LocalDateTime weekAgo,
            LocalDateTime now
    ) {
        double price = basePrice;

        // Holiday factor: +20% on holidays
        double holidayFactor = 0.0;
        if (isHoliday) {
            holidayFactor = 0.20;
        }

        // Demand factor: based on number of bookings in last 7 days for this flight
        List<Booking> recentBookings = bookingRepository
                .findByBookingTypeAndBookingRefAndBookingTimeAfter(
                        "FLIGHT",
                        flight.getId(),
                        weekAgo
                );

        int demand = recentBookings != null ? recentBookings.size() : 0;
        double demandFactor = 0.0;

        // Example thresholds – you can tune these:
        //  0-4 bookings:  +0%
        //  5-9 bookings: +10%
        // 10-19 bookings: +20%
        // 20+ bookings:  +30%
        if (demand >= 20) {
            demandFactor = 0.30;
        } else if (demand >= 10) {
            demandFactor = 0.20;
        } else if (demand >= 5) {
            demandFactor = 0.10;
        }

        double factor = 1.0 + holidayFactor + demandFactor;

        // Optional safety cap: never increase more than +50% of base price
        if (factor > 1.5) {
            factor = 1.5;
        }

        price = basePrice * factor;
        return price;
    }

    /**
     * Builds a human-readable reason, stored in PriceHistory.reason
     */
    private String buildReasonForChange(
            Flight flight,
            double basePrice,
            double newPrice,
            boolean isHoliday,
            LocalDateTime weekAgo,
            LocalDateTime now
    ) {
        StringBuilder sb = new StringBuilder("dynamic pricing: ");

        if (isHoliday) {
            sb.append("holiday +20%; ");
        }

        List<Booking> recentBookings = bookingRepository
                .findByBookingTypeAndBookingRefAndBookingTimeAfter(
                        "FLIGHT",
                        flight.getId(),
                        weekAgo
                );

        int demand = recentBookings != null ? recentBookings.size() : 0;

        if (demand >= 20) {
            sb.append("high demand (20+ bookings in last 7 days); ");
        } else if (demand >= 10) {
            sb.append("medium demand (10–19 bookings in last 7 days); ");
        } else if (demand >= 5) {
            sb.append("light demand (5–9 bookings in last 7 days); ");
        } else {
            sb.append("low demand; ");
        }

        sb.append("base=").append(basePrice)
          .append(", new=").append(newPrice);

        return sb.toString();
    }

    private double roundToCents(double d) {
        return Math.round(d * 100.0) / 100.0;
    }
}
