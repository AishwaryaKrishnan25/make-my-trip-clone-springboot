package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

/**
 * Stores user feedback for recommended items.
 */
@Document(collection = "recommendation_feedback")
public class RecommendationFeedback {
    @Id
    private String id;
    private String userId;
    private String recommendedEntityType; // "flight" | "hotel"
    private String recommendedEntityId;
    private boolean liked; // true = liked, false = disliked
    private LocalDateTime timestamp;

    public RecommendationFeedback() {}

    public RecommendationFeedback(String userId, String recommendedEntityType, String recommendedEntityId, boolean liked, LocalDateTime timestamp) {
        this.userId = userId;
        this.recommendedEntityType = recommendedEntityType;
        this.recommendedEntityId = recommendedEntityId;
        this.liked = liked;
        this.timestamp = timestamp;
    }

    // getters / setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getRecommendedEntityType() { return recommendedEntityType; }
    public void setRecommendedEntityType(String recommendedEntityType) { this.recommendedEntityType = recommendedEntityType; }
    public String getRecommendedEntityId() { return recommendedEntityId; }
    public void setRecommendedEntityId(String recommendedEntityId) { this.recommendedEntityId = recommendedEntityId; }
    public boolean isLiked() { return liked; }
    public void setLiked(boolean liked) { this.liked = liked; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
