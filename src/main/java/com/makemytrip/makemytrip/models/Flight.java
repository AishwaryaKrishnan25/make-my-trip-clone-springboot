package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;
import java.util.List;

@Document(collection = "flight")
public class Flight {
    @Id
    private String id;
    private String flightName;
    private String from;
    private String to;
    private String departureTime;
    private String arrivalTime;
    // basePrice = original price set by admin
    private double basePrice;
    // currentPrice = price visible to customers; subject to dynamic updates
    private double currentPrice;
    private int availableSeats;

    // If non-null and in the future, pricing adjustments are paused
    private Date priceFreezeUntil;
    
    private List<String> tags;

    public Flight() {}

    // existing getters/setters kept; added new ones
    public String getId(){ return id; }
    public void setId(String id){ this.id = id; }
    public String getFlightName(){ return flightName; }
    public void setFlightName(String flightName){ this.flightName = flightName; }
    public String getFrom(){ return from; }
    public void setFrom(String from){ this.from = from; }
    public String getTo(){ return to; }
    public void setTo(String to){ this.to = to; }
    public String getDepartureTime(){ return departureTime; }
    public void setDepartureTime(String departureTime){ this.departureTime = departureTime; }
    public String getArrivalTime(){ return arrivalTime; }
    public void setArrivalTime(String arrivalTime){ this.arrivalTime = arrivalTime; }

    // compatibility: getPrice -> currentPrice
    public double getPrice(){ return currentPrice; }
    public void setPrice(double price){ this.currentPrice = price; }

    public double getBasePrice() { return basePrice; }
    public void setBasePrice(double basePrice) { this.basePrice = basePrice; }

    public double getCurrentPrice() { return currentPrice; }
    public void setCurrentPrice(double currentPrice) { this.currentPrice = currentPrice; }

    public int getAvailableSeats(){return availableSeats;}
    public void setAvailableSeats(int availableSeats){this.availableSeats=availableSeats;}

    public Date getPriceFreezeUntil() { return priceFreezeUntil; }
    public void setPriceFreezeUntil(Date priceFreezeUntil) { this.priceFreezeUntil = priceFreezeUntil; }
    
    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }
}
