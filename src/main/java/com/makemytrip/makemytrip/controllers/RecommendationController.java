package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.UserInteraction;
import com.makemytrip.makemytrip.models.RecommendationFeedback;
import com.makemytrip.makemytrip.repositories.UserInteractionRepository;
import com.makemytrip.makemytrip.repositories.RecommendationFeedbackRepository;
import com.makemytrip.makemytrip.services.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/recommendations")
@CrossOrigin(origins = "*")
public class RecommendationController {

    @Autowired
    private RecommendationService recommendationService;

    @Autowired
    private UserInteractionRepository interactionRepository;

    @Autowired
    private RecommendationFeedbackRepository feedbackRepository;

    /**
     * GET /recommendations/{userId}?limit=6
     * returns list of recommended items (flights/hotels) with 'why' text
     */
    @GetMapping("/{userId}")
    public ResponseEntity<?> getRecommendations(@PathVariable String userId, @RequestParam(defaultValue = "6") int limit) {
        try {
            List<Map<String,Object>> recs = recommendationService.recommendForUser(userId, limit);
            return ResponseEntity.ok(recs);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * POST /interactions
     * body: { userId, entityType, entityId, action }
     * used by frontend to record views, likes, bookings, etc.
     */
    @PostMapping("/interactions")
    public ResponseEntity<?> recordInteraction(@RequestBody Map<String,Object> body) {
        try {
            String userId = (String) body.get("userId");
            String entityType = (String) body.get("entityType");
            String entityId = (String) body.get("entityId");
            String action = (String) body.get("action");
            if (userId == null || entityType == null || entityId == null || action == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "missing fields"));
            }
            UserInteraction ui = new UserInteraction(userId, entityType, entityId, action, LocalDateTime.now());
            interactionRepository.save(ui);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * POST /recommendations/{userId}/feedback
     * body: { recommendedEntityType, recommendedEntityId, liked }
     */
    @PostMapping("/{userId}/feedback")
    public ResponseEntity<?> feedback(@PathVariable String userId, @RequestBody Map<String,Object> body) {
        try {
            String recommendedEntityType = (String) body.get("recommendedEntityType");
            String recommendedEntityId = (String) body.get("recommendedEntityId");
            Boolean liked = (Boolean) body.get("liked");
            if (recommendedEntityType == null || recommendedEntityId == null || liked == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "missing fields"));
            }
            RecommendationFeedback fb = new RecommendationFeedback(userId, recommendedEntityType, recommendedEntityId, liked, LocalDateTime.now());
            feedbackRepository.save(fb);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }
    @PostMapping("/{userId}/recompute")
    public ResponseEntity<?> recompute(
            @PathVariable String userId,
            @RequestParam(defaultValue = "12") int limit
    ) {
        try {
            List<Map<String,Object>> recs = recommendationService.recommendForUser(userId, limit);
            return ResponseEntity.ok(recs);
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", ex.getMessage()));
        }
    }

}
