package com.makemytrip.makemytrip.repositories;

import com.makemytrip.makemytrip.models.Preference;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface PreferenceRepository extends MongoRepository<Preference, String> {
    Optional<Preference> findByUserId(String userId);
}
