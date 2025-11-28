package com.makemytrip.makemytrip.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Cached recommendations per user.
 */
@Document(collection = "user_recommendations")
public class UserRecommendations {
    @Id
    private String id; // userId
    private String userId;
    // list of recommendation items; each item is a map e.g. {type, id, title, price, destination, score, why}
    private List<Map<String, Object>> recommendations;
    private LocalDateTime generatedAt;

    public UserRecommendations() {}

    public UserRecommendations(String userId, List<Map<String, Object>> recommendations, LocalDateTime generatedAt) {
        this.userId = userId;
        this.recommendations = recommendations;
        this.generatedAt = generatedAt;
    }

    // getters / setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public List<Map<String, Object>> getRecommendations() { return recommendations; }
    public void setRecommendations(List<Map<String, Object>> recommendations) { this.recommendations = recommendations; }
    public LocalDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(LocalDateTime generatedAt) { this.generatedAt = generatedAt; }
}
