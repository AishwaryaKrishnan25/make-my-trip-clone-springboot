package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.UserRecommendations;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRecommendationsRepository extends MongoRepository<UserRecommendations, String> {
    UserRecommendations findByUserId(String userId);
}
