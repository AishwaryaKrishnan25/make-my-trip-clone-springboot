package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "hotels")
public class Hotel {
    @Id
    private String id;
    private String hotelName;
    private String location;
    private double pricePerNight;
    private int availableRooms;
    private String amenities;
    private String checkInTime;
    private String description;

    public String getDescription() {
		return description;
	}
	public void setDescription(String description) {
		this.description = description;
	}
	public String getCheckInTime() {
		return checkInTime;
	}
	public void setCheckInTime(String checkInTime) {
		this.checkInTime = checkInTime;
	}
    public String getId(){return id;}
    public void setId(String id){this.id=id;}
    public String getHotelName(){return hotelName;}
    public void setHotelName(String hotelName){this.hotelName=hotelName;}
    public String getLocation(){return location;}
    public void setLocation(String location){this.location=location;}
    public double getPricePerNight(){return pricePerNight;}
    public void setPricePerNight(double pricePerNight){this.pricePerNight=pricePerNight;}
    public int getAvailableRooms(){return availableRooms;}
    public void setAvailableRooms(int availableRooms){this.availableRooms=availableRooms;}
    public String getAmenities(){return amenities;}
    public void setAmenities(String amenities){this.amenities=amenities;}
}
