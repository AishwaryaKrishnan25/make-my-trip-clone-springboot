package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.Review;
import com.makemytrip.makemytrip.repositories.ReviewRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewRepository reviewRepository;

    // list reviews (sort param: helpful | recent)
    @GetMapping
    public ResponseEntity<List<Review>> getReviews(
            @RequestParam String entityType,
            @RequestParam String entityId,
            @RequestParam(required = false, defaultValue = "helpful") String sort
    ) {
        List<Review> reviews;
        if ("recent".equalsIgnoreCase(sort)) {
            reviews = reviewRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);
        } else {
            reviews = reviewRepository.findByEntityTypeAndEntityIdOrderByHelpfulCountDesc(entityType, entityId);
        }
        return ResponseEntity.ok(reviews);
    }

    // create review
    @PostMapping
    public ResponseEntity<Review> createReview(@RequestBody Review payload) {
        // validate
        if (payload.getRating() < 1 || payload.getRating() > 5) {
            return ResponseEntity.badRequest().build();
        }
        payload.setCreatedAt(LocalDateTime.now());
        payload.setHelpfulCount(0);
        payload.setFlags(0);
        Review saved = reviewRepository.save(payload);
        return ResponseEntity.ok(saved);
    }

    // reply to review
    @PostMapping("/{id}/reply")
    public ResponseEntity<Review> replyToReview(@PathVariable String id, @RequestBody ReplyRequest body) {
        Optional<Review> r = reviewRepository.findById(id);
        if (r.isEmpty()) return ResponseEntity.notFound().build();
        Review review = r.get();
        Review.Reply reply = new Review.Reply(UUID.randomUUID().toString(), body.getUserId(), body.getText(), LocalDateTime.now());
        review.getReplies().add(reply);
        reviewRepository.save(review);
        return ResponseEntity.ok(review);
    }

    public static class ReplyRequest {
        private String userId;
        private String text;
        public String getUserId(){return userId;}
        public void setUserId(String userId){this.userId=userId;}
        public String getText(){return text;}
        public void setText(String text){this.text=text;}
    }

    // helpful vote
    @PostMapping("/{id}/helpful")
    public ResponseEntity<Review> markHelpful(@PathVariable String id, @RequestBody HelpfulRequest body) {
        Optional<Review> r = reviewRepository.findById(id);
        if (r.isEmpty()) return ResponseEntity.notFound().build();
        Review review = r.get();
        if (body.getUserId() != null && !review.getHelpfulBy().contains(body.getUserId())) {
            review.getHelpfulBy().add(body.getUserId());
            review.setHelpfulCount(review.getHelpfulCount() + 1);
            reviewRepository.save(review);
        }
        return ResponseEntity.ok(review);
    }

    public static class HelpfulRequest {
        private String userId;
        public String getUserId(){return userId;}
        public void setUserId(String userId){this.userId=userId;}
    }

    // flag
    @PostMapping("/{id}/flag")
    public ResponseEntity<Review> flagReview(@PathVariable String id, @RequestBody FlagRequest body) {
        Optional<Review> r = reviewRepository.findById(id);
        if (r.isEmpty()) return ResponseEntity.notFound().build();
        Review review = r.get();
        review.setFlags(review.getFlags() + 1);
        reviewRepository.save(review);
        return ResponseEntity.ok(review);
    }

    public static class FlagRequest {
        private String reason;
        public String getReason(){return reason;}
        public void setReason(String reason){this.reason=reason;}
    }

    // upload photo(s); returns URL for saved file(s)
    @PostMapping("/upload")
    public ResponseEntity<UploadResponse> uploadPhoto(@RequestParam("file") MultipartFile file) {
        try {
            String uploadsDir = "uploads/reviews";
            File dir = new File(uploadsDir);
            if (!dir.exists()) dir.mkdirs();

            String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            File target = new File(dir, filename);
            Files.copy(file.getInputStream(), target.toPath(), StandardCopyOption.REPLACE_EXISTING);

            // In dev we serve files from /uploads via WebConfig static mapping
            String url = "/uploads/reviews/" + filename;
         String absoluteUrl = ServletUriComponentsBuilder.fromCurrentContextPath().path(url).toUriString();
         return ResponseEntity.ok(new UploadResponse(absoluteUrl));
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    public static class UploadResponse {
        private String url;
        public UploadResponse(String url){ this.url = url; }
        public String getUrl(){ return url; }
        public void setUrl(String url){ this.url = url; }
    }
}
