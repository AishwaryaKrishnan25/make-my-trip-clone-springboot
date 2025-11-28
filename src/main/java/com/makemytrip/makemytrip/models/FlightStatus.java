package com.makemytrip.makemytrip.models;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class FlightStatus {

    private String flightId;
    private String flightName;

    private String status;            // ON_TIME | DELAYED | ARRIVED
    private long delayMinutes;        // 0 if on time
    private String delayReason;       // Weather, ATC, Technical

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime estimatedArrival;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime lastUpdated;

    public FlightStatus() {}

    public FlightStatus(String id, String name, String status,
                        long delayMinutes, String delayReason,
                        LocalDateTime eta, LocalDateTime updated) {
        this.flightId = id;
        this.flightName = name;
        this.status = status;
        this.delayMinutes = delayMinutes;
        this.delayReason = delayReason;
        this.estimatedArrival = eta;
        this.lastUpdated = updated;
    }

    // Getters and setters
    public String getFlightId() { return flightId; }
    public void setFlightId(String flightId) { this.flightId = flightId; }

    public String getFlightName() { return flightName; }
    public void setFlightName(String flightName) { this.flightName = flightName; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public long getDelayMinutes() { return delayMinutes; }
    public void setDelayMinutes(long delayMinutes) { this.delayMinutes = delayMinutes; }

    public String getDelayReason() { return delayReason; }
    public void setDelayReason(String delayReason) { this.delayReason = delayReason; }

    public LocalDateTime getEstimatedArrival() { return estimatedArrival; }
    public void setEstimatedArrival(LocalDateTime estimatedArrival) { this.estimatedArrival = estimatedArrival; }

    public LocalDateTime getLastUpdated() { return lastUpdated; }
    public void setLastUpdated(LocalDateTime lastUpdated) { this.lastUpdated = lastUpdated; }
}
