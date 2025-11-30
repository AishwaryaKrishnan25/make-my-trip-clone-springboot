package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Document(collection = "bookings")
public class Booking {

	@Id
	private String id;
	private String userId;
	private String bookingType; // FLIGHT | HOTEL
	private String bookingRef;  // flightId / hotelId or external ref
	private double totalAmount;
	private LocalDateTime bookingTime;
	private String status; // CONFIRMED | CANCELLED

	private String cancellationReason;
	private LocalDateTime cancellationTime;
	private double refundAmount;
	private String refundStatus; // PENDING | COMPLETED | FAILED

	private int seats;
	private String seatId;
	private Double seatPrice;
	
	// --------- GETTERS / SETTERS ----------
	public String getId() { return id; }
	public void setId(String id) { this.id = id; }

	public String getUserId() { return userId; }
	public void setUserId(String userId) { this.userId = userId; }

	public String getBookingType() { return bookingType; }
	public void setBookingType(String bookingType) { this.bookingType = bookingType; }

	public String getBookingRef() { return bookingRef; }
	public void setBookingRef(String bookingRef) { this.bookingRef = bookingRef; }

	public double getTotalAmount() { return totalAmount; }
	public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }

	public LocalDateTime getBookingTime() { return bookingTime; }
	public void setBookingTime(LocalDateTime bookingTime) { this.bookingTime = bookingTime; }

	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }

	public String getCancellationReason() { return cancellationReason; }
	public void setCancellationReason(String cancellationReason) { this.cancellationReason = cancellationReason; }

	public LocalDateTime getCancellationTime() { return cancellationTime; }
	public void setCancellationTime(LocalDateTime cancellationTime) { this.cancellationTime = cancellationTime; }

	public double getRefundAmount() { return refundAmount; }
	public void setRefundAmount(double refundAmount) { this.refundAmount = refundAmount; }

	public String getRefundStatus() { return refundStatus; }
	public void setRefundStatus(String refundStatus) { this.refundStatus = refundStatus; }
	public String getSeatId() {
		return seatId;
	}
	public void setSeatId(String seatId) {
		this.seatId = seatId;
	}
	public Double getSeatPrice() {
		return seatPrice;
	}
	public void setSeatPrice(Double seatPrice) {
		this.seatPrice = seatPrice;
	}
	public int getSeats() {
		return seats;
	}
	public void setSeats(int seats) {
		this.seats = seats;
	}
}
