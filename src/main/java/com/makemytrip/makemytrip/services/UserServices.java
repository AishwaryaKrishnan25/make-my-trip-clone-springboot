package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Users;
import com.makemytrip.makemytrip.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.password.PasswordEncoder;

@Service
public class UserServices {
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Signup a new user. Default role = USER if not provided.
     */
    public Users signup(Users user) {
        if (userRepository.findByEmail(user.getEmail()) != null) {
            throw new RuntimeException("Email already registered");
        }

        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("USER");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    /**
     * Login: verify email + password. Returns user on success, null on failure.
     */
    public Users login(String email, String password) {
        Users existing = userRepository.findByEmail(email);
        if (existing == null) {
            return null;
        }
        if (!passwordEncoder.matches(password, existing.getPassword())) {
            return null;
        }
        return existing;
    }

    public Users getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Users editprofile(String id, Users updatedUser) {
        Users user = userRepository.findById(id).orElse(null);
        if (user != null) {
            user.setFirstName(updatedUser.getFirstName());
            user.setLastName(updatedUser.getLastName());
            user.setPhoneNumber(updatedUser.getPhoneNumber());
            return userRepository.save(user);
        }
        return null;
    }
}
