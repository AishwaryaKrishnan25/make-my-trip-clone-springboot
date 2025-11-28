package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Map;

@Document(collection = "preferences")
public class Preference {
	@Id
	private String id;
	private String userId;
	private Map<String, Object> data; // e.g., { "seatPref": { "window": true }, "roomPref": { "type": "Deluxe" } }

	// getters/setters
	public String getId(){return id;}
	public void setId(String id){this.id=id;}
	public String getUserId(){return userId;}
	public void setUserId(String userId){this.userId=userId;}
	public Map<String,Object> getData(){return data;}
	public void setData(Map<String,Object> data){this.data=data;}
}

//@Id
//private String id;
//
//private String userId;
//private String preferredSeatType;  
//private String preferredSeatId;
//
//public UserPreferences() {}
//
//public UserPreferences(String userId) {
//    this.userId = userId;
//}
//
//// Getters + Setters
//public String getId() { return id; }
//
//public String getUserId() { return userId; }
//public void setUserId(String userId) { this.userId = userId; }
//
//public String getPreferredSeatType() { return preferredSeatType; }
//public void setPreferredSeatType(String preferredSeatType) { this.preferredSeatType = preferredSeatType; }
//
//public String getPreferredSeatId() { return preferredSeatId; }
//public void setPreferredSeatId(String preferredSeatId) { this.preferredSeatId = preferredSeatId; }
//}