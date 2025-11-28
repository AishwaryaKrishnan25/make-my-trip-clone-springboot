package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.PriceHistory;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.PriceHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/pricing")
public class PricingController {

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private PriceHistoryRepository priceHistoryRepository;

    /**
     * Get current price + base price + freezeUntil for a flight.
     * Open endpoint (used by UI / booking page).
     */
    @GetMapping("/flight/{flightId}/price")
    public ResponseEntity<?> getFlightCurrentPrice(@PathVariable String flightId) {
        Optional<Flight> opt = flightRepository.findById(flightId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Flight not found"));
        }

        Flight f = opt.get();
        double base = f.getBasePrice();
        double current = f.getCurrentPrice();

        if (current <= 0.0 && base > 0.0) {
            current = base;
        }

        Map<String, Object> resp = new HashMap<>();
        resp.put("flightId", f.getId());
        resp.put("basePrice", base);
        resp.put("currentPrice", current);
        resp.put("priceFreezeUntil", f.getPriceFreezeUntil());

        return ResponseEntity.ok(resp);
    }

    /**
     * Get price history for a flight (for graphs).
     */
    @GetMapping("/flight/{flightId}/history")
    public ResponseEntity<?> getFlightPriceHistory(@PathVariable String flightId) {
        List<PriceHistory> history =
                priceHistoryRepository.findByProductTypeAndProductIdOrderByTimestampAsc("flight", flightId);
        return ResponseEntity.ok(history);
    }

    /**
     * Set/update base price for a flight.
     * Logs a history entry to indicate manual change.
     */
    @PostMapping("/flight/{flightId}/setBasePrice")
    public ResponseEntity<?> setBasePrice(
            @PathVariable String flightId,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Object bp = body.get("basePrice");
            if (bp == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "basePrice is required"));
            }

            double basePrice = Double.parseDouble(bp.toString());

            Optional<Flight> opt = flightRepository.findById(flightId);
            if (opt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Flight not found"));
            }

            Flight f = opt.get();
            f.setBasePrice(basePrice);

            // if current price not yet set, set it to base
            if (f.getCurrentPrice() <= 0.0) {
                f.setCurrentPrice(basePrice);
            }

            flightRepository.save(f);

            // Log base price change as history
            PriceHistory ph = new PriceHistory(
                    "flight",
                    f.getId(),
                    f.getCurrentPrice(),
                    new Date(),
                    "admin set base price"
            );
            priceHistoryRepository.save(ph);

            return ResponseEntity.ok(f);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Freeze current price for given minutes.
     * NOTE: We DO NOT log a PriceHistory entry here.
     * The actual graph should only show real price changes,
     * not "freeze actions" where price stays the same.
     */
    @PostMapping("/flight/{flightId}/freeze")
    public ResponseEntity<?> freezeFlightPrice(
            @PathVariable String flightId,
            @RequestBody Map<String, Object> body
    ) {
        try {
            Object minutesObj = body.get("minutes");
            int minutes = 30; // default
            if (minutesObj != null) {
                minutes = Integer.parseInt(minutesObj.toString());
            }

            Optional<Flight> opt = flightRepository.findById(flightId);
            if (opt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Flight not found"));
            }

            Flight f = opt.get();

            Date now = new Date();
            Date freezeUntil = new Date(now.getTime() + minutes * 60L * 1000L);
            f.setPriceFreezeUntil(freezeUntil);

            // keep currentPrice as-is; dynamic engine will skip this flight
            if (f.getCurrentPrice() <= 0.0 && f.getBasePrice() > 0.0) {
                f.setCurrentPrice(f.getBasePrice());
            }

            flightRepository.save(f);

            return ResponseEntity.ok(
                    Map.of(
                            "ok", true,
                            "freezeUntil", freezeUntil,
                            "currentPrice", f.getCurrentPrice()
                    )
            );
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }
}
