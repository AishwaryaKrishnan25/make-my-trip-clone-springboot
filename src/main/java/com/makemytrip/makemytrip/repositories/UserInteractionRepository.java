package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.UserInteraction;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserInteractionRepository extends MongoRepository<UserInteraction, String> {
    List<UserInteraction> findByUserIdOrderByTimestampDesc(String userId);

    List<UserInteraction> findByEntityTypeAndEntityId(String entityType, String entityId);

    List<UserInteraction> findByUserIdAndEntityType(String userId, String entityType);
}
