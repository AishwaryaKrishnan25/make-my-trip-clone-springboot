package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;

@Document(collection = "roomTypes")
public class RoomType {
    @Id
    private String id;
    private String hotelId;
    private String name;     // "Deluxe King", etc.
    private String description;
    private double pricePerNight;
    private int availableCount;
    private List<String> amenities;
    private String imageUrl; // thumbnail
    private String preview3DUrl;
    private List<String> previewImages; // urls of 360-degree images

    public List<String> getPreviewImages() {
		return previewImages;
	}
	public void setPreviewImages(List<String> previewImages) {
		this.previewImages = previewImages;
	}
	// getters setters
    public String getId(){return id;}
    public void setId(String id){this.id=id;}
    public String getHotelId(){return hotelId;}
    public void setHotelId(String hotelId){this.hotelId=hotelId;}
    public String getName(){return name;}
    public void setName(String name){this.name=name;}
    public String getDescription(){return description;}
    public void setDescription(String description){this.description=description;}
    public double getPricePerNight(){return pricePerNight;}
    public void setPricePerNight(double pricePerNight){this.pricePerNight=pricePerNight;}
    public int getAvailableCount(){return availableCount;}
    public void setAvailableCount(int availableCount){this.availableCount=availableCount;}
    public List<String> getAmenities(){return amenities;}
    public void setAmenities(List<String> amenities){this.amenities=amenities;}
    public String getImageUrl(){return imageUrl;}
    public void setImageUrl(String imageUrl){this.imageUrl=imageUrl;}
    public String getPreview3DUrl(){return preview3DUrl;}
    public void setPreview3DUrl(String preview3DUrl){this.preview3DUrl=preview3DUrl;}
}
