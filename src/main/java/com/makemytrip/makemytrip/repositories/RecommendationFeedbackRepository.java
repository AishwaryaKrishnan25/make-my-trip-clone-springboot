package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.RecommendationFeedback;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RecommendationFeedbackRepository extends MongoRepository<RecommendationFeedback, String> {
    List<RecommendationFeedback> findByUserId(String userId);
}
