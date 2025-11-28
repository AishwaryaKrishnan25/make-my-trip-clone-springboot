package com.makemytrip.makemytrip.services;

import com.makemytrip.makemytrip.models.Booking;
import com.makemytrip.makemytrip.models.Flight;
import com.makemytrip.makemytrip.models.Hotel;
import com.makemytrip.makemytrip.models.UserInteraction;
import com.makemytrip.makemytrip.models.RecommendationFeedback;
import com.makemytrip.makemytrip.repositories.BookingRepository;
import com.makemytrip.makemytrip.repositories.FlightRepository;
import com.makemytrip.makemytrip.repositories.HotelRepository;
import com.makemytrip.makemytrip.repositories.UserInteractionRepository;
import com.makemytrip.makemytrip.repositories.RecommendationFeedbackRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RecommendationService {

    @Autowired
    private UserInteractionRepository interactionRepository;

    @Autowired
    private RecommendationFeedbackRepository feedbackRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private FlightRepository flightRepository;

    @Autowired
    private HotelRepository hotelRepo;

    /** Theme keywords */
    private static final Map<String, String> THEME_KEYWORDS = Map.ofEntries(
    		  // --- BEACH / SEA / ISLAND ---
            Map.entry("beach", "Beach"),
            Map.entry("sea", "Beach"),
            Map.entry("ocean", "Beach"),
            Map.entry("island", "Beach"),

            // --- MOUNTAINS / HILLS ---
            Map.entry("mountain", "Mountains"),
            Map.entry("hill", "Mountains"),
            Map.entry("hills", "Mountains"),

            // --- LUXURY / PREMIUM ---
            Map.entry("luxury", "Luxury"),
            Map.entry("premium", "Luxury"),
            Map.entry("spa", "Luxury"),
            Map.entry("resort", "Luxury"),
            Map.entry("villa", "Luxury"),
            Map.entry("5-star", "Luxury"),
            Map.entry("five star", "Luxury"),

            // --- BUSINESS / METRO TRAVEL ---
            Map.entry("chennai", "Metro Travel"),
            Map.entry("delhi", "Metro Travel"),
            Map.entry("bengaluru", "Metro Travel"),
            Map.entry("bangalore", "Metro Travel"),
            Map.entry("hyderabad", "Metro Travel"),
            Map.entry("mumbai", "Metro Travel"),
            Map.entry("kolkata", "Metro Travel"),

            // --- NIGHTLIFE / PARTY ---
            Map.entry("nightlife", "Party"),
            Map.entry("club", "Party"),
            Map.entry("bar", "Party"),
            Map.entry("pub", "Party"),
            Map.entry("lounge", "Party"),

            // --- CULTURE / HERITAGE ---
            Map.entry("temple", "Culture"),
            Map.entry("heritage", "Culture"),
            Map.entry("museum", "Culture"),
            Map.entry("historic", "Culture"),
            Map.entry("culture", "Culture"),

            // --- FOOD / DINING ---
            Map.entry("restaurant", "Dining"),
            Map.entry("dining", "Dining"),
            Map.entry("cafe", "Dining"),
            Map.entry("buffet", "Dining"),

            // --- NATURE / GARDENS ---
            Map.entry("garden", "Nature"),
            Map.entry("park", "Nature"),
            Map.entry("greenery", "Nature")
    );

    private Set<String> extractThemes(String... fields) {
        Set<String> themes = new HashSet<>();
        for (String text : fields) {
            if (text == null) continue;
            String lower = text.toLowerCase();
            for (String key : THEME_KEYWORDS.keySet()) {
                if (lower.contains(key)) themes.add(THEME_KEYWORDS.get(key));
            }
        }
        return themes;
    }

    /** FINAL RECOMMENDER */
    public List<Map<String, Object>> recommendForUser(String userId, int maxResults) {

        List<UserInteraction> interactions =
                interactionRepository.findByUserIdOrderByTimestampDesc(userId);

        // 1. COLD START
        if (interactions.isEmpty()) {
            return coldStartRecommendations(maxResults);
        }

        // 2. THEME DETECTION
        Set<String> userThemes = new HashSet<>();

        for (UserInteraction ui : interactions) {
            if ("flight".equals(ui.getEntityType())) {
                flightRepository.findById(ui.getEntityId()).ifPresent(f ->
                        userThemes.addAll(extractThemes(f.getFlightName(), f.getTo()))
                );
            }

            if ("hotel".equals(ui.getEntityType())) {
                hotelRepo.findById(ui.getEntityId()).ifPresent(h ->
                        userThemes.addAll(extractThemes(
                                h.getHotelName(),
                                h.getLocation(),
                                h.getAmenities(),
                                h.getDescription()
                        ))
                );
            }
        }

        // 3. IF NO THEMES → POPULAR RECOMMENDATIONS
        if (userThemes.isEmpty()) {
            return collaborativeFilteringFallback(userId, maxResults);
        }

        // 4. RANKED RECOMMENDATIONS
        List<Map<String, Object>> recommendations = new ArrayList<>();

        for (Flight f : flightRepository.findAll()) {
            Set<String> matched = extractThemes(f.getFlightName(), f.getTo());
            if (!Collections.disjoint(userThemes, matched)) {
                recommendations.add(buildFlightRec(f, matched));
            }
        }

        for (Hotel h : hotelRepo.findAll()) {
            Set<String> matched = extractThemes(
                    h.getHotelName(),
                    h.getLocation(),
                    h.getAmenities(),
                    h.getDescription()
            );
            if (!Collections.disjoint(userThemes, matched)) {
                recommendations.add(buildHotelRec(h, matched));
            }
        }

        // 5. FEEDBACK FILTER
        Set<String> disliked = feedbackRepository.findByUserId(userId).stream()
                .filter(f -> !f.isLiked())
                .map(RecommendationFeedback::getRecommendedEntityId)
                .collect(Collectors.toSet());

        recommendations = recommendations.stream()
                .filter(r -> !disliked.contains(r.get("id")))
                .collect(Collectors.toList());

       
     // 6. MIX HOTELS + FLIGHTS IF NEEDED (GUARANTEED MINIMUM RESULTS)
        if (recommendations.size() < maxResults) {
            for (Hotel h : hotelRepo.findAll()) {
                if (recommendations.stream().noneMatch(r -> r.get("id").equals(h.getId()))) {
                    recommendations.add(buildHotelRec(h, Set.of("Popular")));
                }
                if (recommendations.size() >= maxResults) break;
            }
        }

        if (recommendations.size() < maxResults) {
            for (Flight f : flightRepository.findAll()) {
                if (recommendations.stream().noneMatch(r -> r.get("id").equals(f.getId()))) {
                    recommendations.add(buildFlightRec(f, Set.of("Popular")));
                }
                if (recommendations.size() >= maxResults) break;
            }
        }


        // 7. SORT → Hotels first, then flights
        return recommendations.stream()
                .sorted(Comparator.comparing(r -> r.get("type").equals("hotel") ? 0 : 1))
                .limit(maxResults)
                .collect(Collectors.toList());
    }

    /** Popular flights fallback */
    private List<Map<String,Object>> collaborativeFilteringFallback(String userId, int maxResults) {

        Map<String,Integer> counts = new HashMap<>();
        for (Booking b : bookingRepository.findAll()) {
            if ("flight".equalsIgnoreCase(b.getBookingType())) {
                counts.put(b.getBookingRef(), counts.getOrDefault(b.getBookingRef(), 0) + 1);
            }
        }

        List<Map<String,Object>> out = new ArrayList<>();

        for (String id : counts.keySet()) {
            Optional<Flight> f = flightRepository.findById(id);
            f.ifPresent(flight -> out.add(buildFlightRec(flight, Set.of("Popular"))));
            if (out.size() >= maxResults) break;
        }

        return out;
    }

    /** Cold Start: mix flights + hotels */
    private List<Map<String,Object>> coldStartRecommendations(int max) {
        List<Map<String,Object>> out = new ArrayList<>();
        List<Flight> flights = flightRepository.findAll();
        List<Hotel> hotels = hotelRepo.findAll();

        for (int i = 0; i < max; i++) {
            if (i < flights.size()) out.add(buildFlightRec(flights.get(i), Set.of("Popular")));
            if (i < hotels.size()) out.add(buildHotelRec(hotels.get(i), Set.of("Popular")));
        }
        return out;
    }

    private Map<String, Object> buildFlightRec(Flight f, Set<String> themes) {
        return Map.of(
                "type", "flight",
                "id", f.getId(),
                "title", f.getFlightName() + " → " + f.getTo(),
                "destination", f.getTo(),
                "price", f.getCurrentPrice(),
                "why", "Because you like: " + String.join(", ", themes)
        );
    }

    private Map<String, Object> buildHotelRec(Hotel h, Set<String> themes) {
        return Map.of(
                "type", "hotel",
                "id", h.getId(),
                "title", h.getHotelName(),
                "location", h.getLocation(),
                "price", h.getPricePerNight(),
                "why", "Because you enjoy: " + String.join(", ", themes)
        );
    }
}
