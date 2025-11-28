package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Preference;
import com.makemytrip.makemytrip.repositories.PreferenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/preferences")
@CrossOrigin(origins = "*")
public class PreferenceController {
    @Autowired
    private PreferenceRepository prefRepo;

    @GetMapping("/{userId}")
    public ResponseEntity<Preference> getPrefs(@PathVariable String userId){
        return prefRepo.findByUserId(userId).map(ResponseEntity::ok).orElseGet(()->ResponseEntity.notFound().build());
    }

    @PostMapping("/{userId}")
    public ResponseEntity<Preference> savePrefs(@PathVariable String userId, @RequestBody Map<String,Object> data){
        Preference p = prefRepo.findByUserId(userId).orElse(new Preference());
        p.setUserId(userId);
        p.setData(data);
        prefRepo.save(p);
        return ResponseEntity.ok(p);
    }
}

