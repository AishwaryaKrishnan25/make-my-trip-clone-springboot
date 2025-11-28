package com.makemytrip.makemytrip.controllers;

import com.makemytrip.makemytrip.models.RoomType;
import com.makemytrip.makemytrip.repositories.RoomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class RoomController {

    @Autowired
    private RoomRepository roomRepository;

    // Fetch all room types for a hotel
    @GetMapping("/hotel/{hotelId}")
    public ResponseEntity<List<RoomType>> getRooms(@PathVariable String hotelId) {
        List<RoomType> rooms = roomRepository.findByHotelId(hotelId);
        return ResponseEntity.ok(rooms);
    }

    // Reserve room
    @PostMapping("/{roomId}/reserve")
    public ResponseEntity<RoomType> reserveRoom(
            @PathVariable String roomId,
            @RequestParam int count
    ) {
        RoomType r = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        if (r.getAvailableCount() < count) {
            throw new RuntimeException("Not enough rooms available");
        }

        r.setAvailableCount(r.getAvailableCount() - count);
        roomRepository.save(r);
        return ResponseEntity.ok(r);
    }

    // Release room
    @PostMapping("/{roomId}/release")
    public ResponseEntity<RoomType> releaseRoom(
            @PathVariable String roomId,
            @RequestParam int count
    ) {
        RoomType r = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        r.setAvailableCount(r.getAvailableCount() + count);
        roomRepository.save(r);
        return ResponseEntity.ok(r);
    }

    // Get preview 3D URL (for iframe viewer, Room3DPreview)
    @GetMapping("/{roomId}/preview3d")
    public ResponseEntity<String> getPreview3D(@PathVariable String roomId) {
        RoomType room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        return ResponseEntity.ok(room.getPreview3DUrl());
    }

    // Get 360 images (for gallery, Room3DViewer)
    @GetMapping("/{roomId}/preview-images")
    public ResponseEntity<List<String>> getPreviewImages(@PathVariable String roomId) {
        RoomType room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        return ResponseEntity.ok(room.getPreviewImages());
    }
}
