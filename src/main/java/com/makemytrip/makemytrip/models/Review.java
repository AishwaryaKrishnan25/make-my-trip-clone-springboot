package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "reviews")
public class Review {
    @Id
    private String id;

    private String entityType; // "HOTEL" or "FLIGHT"
    private String entityId;   // hotelId or flightId

    private String userId;     // who wrote the review
    private int rating;        // 1..5
    private String text;
    private List<String> photos = new ArrayList<>();

    private LocalDateTime createdAt;
    private int helpfulCount;
    private int flags;         // number of flags

    private List<Reply> replies = new ArrayList<>();

    // simple list of user ids who marked helpful - for idempotency (optional)
    private List<String> helpfulBy = new ArrayList<>();

    public static class Reply {
        private String id;
        private String userId;
        private String text;
        private LocalDateTime createdAt;

        public Reply() {}
        public Reply(String id, String userId, String text, LocalDateTime createdAt){
            this.id=id;this.userId=userId;this.text=text;this.createdAt=createdAt;
        }
        public String getId(){return id;}
        public void setId(String id){this.id=id;}
        public String getUserId(){return userId;}
        public void setUserId(String userId){this.userId=userId;}
        public String getText(){return text;}
        public void setText(String text){this.text=text;}
        public LocalDateTime getCreatedAt(){return createdAt;}
        public void setCreatedAt(LocalDateTime createdAt){this.createdAt=createdAt;}
    }

    // getters & setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public List<String> getPhotos() { return photos; }
    public void setPhotos(List<String> photos) { this.photos = photos; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public int getHelpfulCount() { return helpfulCount; }
    public void setHelpfulCount(int helpfulCount) { this.helpfulCount = helpfulCount; }

    public int getFlags() { return flags; }
    public void setFlags(int flags) { this.flags = flags; }

    public List<Reply> getReplies() { return replies; }
    public void setReplies(List<Reply> replies) { this.replies = replies; }

    public List<String> getHelpfulBy() { return helpfulBy; }
    public void setHelpfulBy(List<String> helpfulBy) { this.helpfulBy = helpfulBy; }
}
