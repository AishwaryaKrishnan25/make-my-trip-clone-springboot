package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.Review;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ReviewRepository extends MongoRepository<Review, String> {
    List<Review> findByEntityTypeAndEntityIdOrderByHelpfulCountDesc(String entityType, String entityId);
    List<Review> findByEntityTypeAndEntityIdOrderByCreatedAtDesc(String entityType, String entityId);
    List<Review> findByEntityTypeAndEntityId(String entityType, String entityId);
}
