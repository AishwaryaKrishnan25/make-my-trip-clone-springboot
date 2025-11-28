package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "seats")
public class Seat {
    @Id
    private String id;         // seat unique id like "1A" or generated id
    private String flightId;   // associated flight
    private String row;
    private String col;
    private String category;   // ECONOMY | PREMIUM | BUSINESS | EXIT_ROW | EXTRA_LEGROOM
    private boolean window;
    private boolean aisle;
    private boolean reserved;
    private String reservedBy; // userId or null
    private double upsellPrice; // extra price if premium
    private String notes;
    
    private boolean premium;
    private double premiumPrice; // extra charge for the seat


    public boolean isPremium() {
		return premium;
	}
	public void setPremium(boolean premium) {
		this.premium = premium;
	}
	public double getPremiumPrice() {
		return premiumPrice;
	}
	public void setPremiumPrice(double premiumPrice) {
		this.premiumPrice = premiumPrice;
	}
	// getters/setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFlightId() { return flightId; }
    public void setFlightId(String flightId) { this.flightId = flightId; }

    public String getRow() { return row; }
    public void setRow(String row) { this.row = row; }

    public String getCol() { return col; }
    public void setCol(String col) { this.col = col; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    // boolean getters: both isX() and getX() so callers using either style work
    public boolean isWindow() { return window; }
    public Boolean getWindow() { return window; }
    public void setWindow(boolean window) { this.window = window; }

    public boolean isAisle() { return aisle; }
    public Boolean getAisle() { return aisle; }
    public void setAisle(boolean aisle) { this.aisle = aisle; }

    public boolean isReserved() { return reserved; }
    public Boolean getReserved() { return reserved; }
    public void setReserved(boolean reserved) { this.reserved = reserved; }

    public String getReservedBy() { return reservedBy; }
    public void setReservedBy(String reservedBy) { this.reservedBy = reservedBy; }

    public double getUpsellPrice() { return upsellPrice; }
    public void setUpsellPrice(double upsellPrice) { this.upsellPrice = upsellPrice; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
