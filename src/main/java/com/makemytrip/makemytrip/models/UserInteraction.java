package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Stores user interactions such as view, like, booking, etc.
 * Used to generate recommendations.
 */
@Document(collection = "user_interactions")
public class UserInteraction {
    @Id
    private String id;
    private String userId;
    private String entityType; // "flight" | "hotel" | "destination"
    private String entityId;   // flightId, hotelId or destination slug (e.g., "bali")
    private String action;     // "view" | "like" | "book" | "ignore"
    private LocalDateTime timestamp;

    public UserInteraction() {}

    public UserInteraction(String userId, String entityType, String entityId, String action, LocalDateTime timestamp) {
        this.userId = userId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.action = action;
        this.timestamp = timestamp;
    }

    // getters / setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
