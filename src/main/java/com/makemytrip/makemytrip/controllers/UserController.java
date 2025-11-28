package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.config.JwtUtil;
import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.services.UserServices;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/user")
@CrossOrigin(origins = "*")
public class UserController {
    @Autowired
    private UserServices userServices;

    @Autowired
    private JwtUtil jwtUtil;

    /**
     * LOGIN
     * Request: POST /user/login?email=...&password=...
     * Response: { token, user }
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestParam String email,
                                   @RequestParam String password) {
        Users user = userServices.login(email, password);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "user", user
        ));
    }

    /**
     * SIGNUP
     * Request: POST /user/signup  (JSON body)
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Users newUser) {
        try {
            Users created = userServices.signup(newUser);
            return ResponseEntity.ok(created);
        } catch (RuntimeException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }

    /**
     * Get user by email (used in frontend getuserbyemail)
     */
    @GetMapping("/email")
    public ResponseEntity<Users> getuserbyemail(@RequestParam String email) {
        Users user = userServices.getUserByEmail(email);
        if (user != null) {
            return ResponseEntity.ok(user);
        }
        return ResponseEntity.notFound().build();
    }

    /**
     * Edit profile
     */
    @PostMapping("/edit")
    public Users editprofile(@RequestParam String id, @RequestBody Users updatedUser) {
        return userServices.editprofile(id, updatedUser);
    }
}
