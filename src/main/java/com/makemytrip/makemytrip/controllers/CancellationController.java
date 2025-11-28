package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Booking;
import com.makemytrip.makemytrip.models.Refund;
import com.makemytrip.makemytrip.repositories.BookingRepository;
import com.makemytrip.makemytrip.repositories.RefundRepository;
import com.makemytrip.makemytrip.services.CancellationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "*")
public class CancellationController {

    @Autowired
    private CancellationService cancellationService;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private RefundRepository refundRepository;

    // --------- CANCEL BOOKING ----------
    // Frontend: POST /api/bookings/{bookingId}/cancel   body: { "reason": "..." }
    @PostMapping("/{bookingId}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable String bookingId,
                                           @RequestBody CancelRequest body) {
        try {
            if (body == null || body.getReason() == null || body.getReason().isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Cancellation reason is required"));
            }

            Booking booking = cancellationService.cancelBooking(bookingId, body.getReason());
            return ResponseEntity.ok(booking);

        } catch (IllegalArgumentException e) {
            // Booking not found, cannot cancel after departure, etc.
            return ResponseEntity.badRequest()
                    .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to cancel booking"));
        }
    }

    // --------- GET BOOKING DETAILS ----------
    @GetMapping("/{bookingId}")
    public ResponseEntity<Booking> getBooking(@PathVariable String bookingId) {
        return bookingRepository.findById(bookingId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // --------- GET REFUNDS FOR BOOKING ----------
    @GetMapping("/{bookingId}/refunds")
    public ResponseEntity<List<Refund>> getRefundsForBooking(@PathVariable String bookingId) {
        List<Refund> refunds = refundRepository.findByBookingId(bookingId);
        return ResponseEntity.ok(refunds);
    }

    // --------- REQUEST BODY CLASS (DTO) ----------
    public static class CancelRequest {
        private String reason;

        public String getReason() {
            return reason;
        }

        public void setReason(String reason) {
            this.reason = reason;
        }
    }
}
