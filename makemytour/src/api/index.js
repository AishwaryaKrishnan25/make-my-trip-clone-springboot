// src/api/index.js
import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

/* ----------------- Auth / User ----------------- */
export const login = async (email, password) => {
  const url = `${BACKEND_URL}/user/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
  const res = await axios.post(url);
  return res.data;
};

export const signup = async (firstName, lastName, email, phoneNumber, password) => {
  const res = await axios.post(`${BACKEND_URL}/user/signup`, {
    firstName,
    lastName,
    email,
    phoneNumber,
    password,
  });
  return res.data;
};

export const getuserbyemail = async (email) => {
  const res = await axios.get(`${BACKEND_URL}/user/email?email=${encodeURIComponent(email)}`);
  return res.data;
};

export const editprofile = async (id, firstName, lastName, email, phoneNumber) => {
  const res = await axios.post(`${BACKEND_URL}/user/edit?id=${encodeURIComponent(id)}`, {
    firstName,
    lastName,
    email,
    phoneNumber,
  });
  return res.data;
};

/* ----------------- Flight & Hotel Catalog ----------------- */
export const getflight = async () => {
  const res = await axios.get(`${BACKEND_URL}/flight`);
  return res.data;
};

export const gethotel = async () => {
  const res = await axios.get(`${BACKEND_URL}/hotel`);
  return res.data;
};

/* ----------------- Admin Create/Edit ----------------- */
export const addflight = async (flightName, from, to, departureTime, arrivalTime, price, availableSeats) => {
  const res = await axios.post(`${BACKEND_URL}/admin/flight`, {
    flightName,
    from,
    to,
    departureTime,
    arrivalTime,
    price,
    availableSeats,
  });
  return res.data;
};

export const editflight = async (id, flightName, from, to, departureTime, arrivalTime, price, availableSeats) => {
  const res = await axios.put(`${BACKEND_URL}/admin/flight/${encodeURIComponent(id)}`, {
    flightName,
    from,
    to,
    departureTime,
    arrivalTime,
    price,
    availableSeats,
  });
  return res.data;
};

export const addhotel = async (hotelName, location, pricePerNight, availableRooms, amenities) => {
  const res = await axios.post(`${BACKEND_URL}/admin/hotel`, {
    hotelName,
    location,
    pricePerNight,
    availableRooms,
    amenities,
  });
  return res.data;
};

export const edithotel = async (id, hotelName, location, pricePerNight, availableRooms, amenities) => {
  const res = await axios.put(`${BACKEND_URL}/admin/hotel/${encodeURIComponent(id)}`, {
    hotelName,
    location,
    pricePerNight,
    availableRooms,
    amenities,
  });
  return res.data;
};

/* ----------------- Booking ----------------- */
export const getUserBookings = async (userId) => {
  const res = await axios.get(`${BACKEND_URL}/api/bookings/user/${encodeURIComponent(userId)}`);
  return res.data;
};

export const getBooking = async (bookingId) => {
  const res = await axios.get(`${BACKEND_URL}/api/bookings/${encodeURIComponent(bookingId)}`);
  return res.data;
};

export const cancelBooking = async (bookingId, reason) => {
  const res = await axios.post(`${BACKEND_URL}/api/bookings/${encodeURIComponent(bookingId)}/cancel`, {
    reason,
  });
  return res.data;
};

export async function bookHotel({ userId, hotelId, rooms, price }) {
  const res = await axios.post(`${BACKEND_URL}/api/bookings/hotel`, null, {
    params: { userId, hotelId, rooms, price },
  });
  return res.data;
}

export async function bookFlight({ userId, flightId, seats, price }) {
  const res = await axios.post(`${BACKEND_URL}/api/bookings/flight`, null, {
    params: { userId, flightId, seats, price },
  });
  return res.data;
}

/* ----------------- Refunds ----------------- */
export const getRefundsForBooking = async (bookingId) => {
  const res = await axios.get(`${BACKEND_URL}/api/bookings/${encodeURIComponent(bookingId)}/refunds`);
  return res.data;
};

/* ----------------- Reviews ----------------- */
export const getReviews = async ({ entityType, entityId, sort = "helpful" }) => {
  const res = await axios.get(`${BACKEND_URL}/api/reviews`, { params: { entityType, entityId, sort } });
  return res.data;
};

export const postReview = async ({ entityType, entityId, userId, rating, text, photos = [] }) => {
  const res = await axios.post(`${BACKEND_URL}/api/reviews`, {
    entityType,
    entityId,
    userId,
    rating,
    text,
    photos,
  });
  return res.data;
};

export const replyToReview = async ({ reviewId, userId, text }) => {
  const res = await axios.post(`${BACKEND_URL}/api/reviews/${encodeURIComponent(reviewId)}/reply`, {
    userId,
    text,
  });
  return res.data;
};

export const markReviewHelpful = async ({ reviewId, userId }) => {
  const res = await axios.post(`${BACKEND_URL}/api/reviews/${encodeURIComponent(reviewId)}/helpful`, { userId });
  return res.data;
};

export const flagReview = async ({ reviewId, reason }) => {
  const res = await axios.post(`${BACKEND_URL}/api/reviews/${encodeURIComponent(reviewId)}/flag`, { reason });
  return res.data;
};

export const uploadReviewPhoto = async (file) => {
  const form = new FormData();
  form.append("file", file);
  const res = await axios.post(`${BACKEND_URL}/api/reviews/upload`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

/* ----------------- Flight Status SSE ----------------- */
export async function getFlightStatus(flightId) {
  const res = await fetch(`${BACKEND_URL}/api/flight-status/${encodeURIComponent(flightId)}`);
  if (!res.ok) throw new Error("Failed to fetch flight status");
  return await res.json();
}

export async function setDelayMock(flightId, minutes = 30, reason = "Mock delay") {
  const res = await fetch(`${BACKEND_URL}/api/flight-status/${encodeURIComponent(flightId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "DELAYED", delayMinutes: minutes, delayReason: reason }),
  });
  return res;
}

export function createEventSourceWithReconnect(flightId, handlers = {}) {
  const url = `${BACKEND_URL}/api/flight-status/stream/${encodeURIComponent(flightId)}`;
  let es = null;
  let retry = 1000;

  const start = () => {
    es = new EventSource(url);
    es.onopen = handlers.onopen || null;
    es.onerror = handlers.onerror || null;
    es.onmessage = (ev) => {
      const data = JSON.parse(ev.data);
      if (handlers.onmessage) handlers.onmessage(data);
    };
  };

  const close = () => es?.close();

  return { start, close };
}

/* ----------------- Rooms ----------------- */
export async function getRoomTypes(hotelId) {
  const res = await fetch(`${BACKEND_URL}/api/rooms/hotel/${encodeURIComponent(hotelId)}`);
  if (!res.ok) throw new Error("Failed to fetch room types");
  return await res.json();
}

export async function reserveRoom(roomId, count = 1) {
  const res = await fetch(`${BACKEND_URL}/api/rooms/${encodeURIComponent(roomId)}/reserve?count=${count}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to reserve room");
  return await res.json();
}

/* ----------------- Seats ----------------- */
export async function getSeatMap(flightId) {
  const res = await fetch(`${BACKEND_URL}/api/seats/flight/${encodeURIComponent(flightId)}`);
  if (!res.ok) throw new Error("Failed to fetch seat map");
  return await res.json();
}

export async function reserveSeat(seatId, userId) {
  const res = await axios.post(`${BACKEND_URL}/api/seats/${encodeURIComponent(seatId)}/reserve`, null, {
    params: { userId },
  });
  return res.data;
}

export async function releaseSeat(seatId, userId) {
  const res = await axios.post(`${BACKEND_URL}/api/seats/${encodeURIComponent(seatId)}/release`, null, {
    params: { userId },
  });
  return res.data;
}

export function createSeatSSE(flightId, handlers = {}) {
  const url = `${BACKEND_URL}/api/seats/stream/${encodeURIComponent(flightId)}`;
  const es = new EventSource(url);

  es.onmessage = (ev) => {
    const data = JSON.parse(ev.data);
    if (handlers.onmessage) handlers.onmessage(data);
  };

  return { close: () => es.close() };
}

/* ----------------- Preferences ----------------- */
export async function getPreferences(userId) {
  const res = await fetch(`${BACKEND_URL}/api/preferences/${encodeURIComponent(userId)}`);
  if (!res.ok) throw new Error("Failed to load preferences");
  return await res.json();
}

export async function savePreferences(userId, prefs) {
  const res = await fetch(`${BACKEND_URL}/api/preferences/${encodeURIComponent(userId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error("Failed to save preferences");
  return await res.json();
}

/* ----------------- Pricing ----------------- */
export async function getPriceHistory(flightId) {
  const res = await axios.get(`${BACKEND_URL}/pricing/flight/${encodeURIComponent(flightId)}/history`);
  return res.data;
}

export async function freezePrice(flightId, minutes) {
  const res = await axios.post(`${BACKEND_URL}/pricing/flight/${encodeURIComponent(flightId)}/freeze`, {
    minutes,
  });
  return res.data;
}

export async function getCurrentPrice(flightId) {
  const res = await axios.get(`${BACKEND_URL}/pricing/flight/${encodeURIComponent(flightId)}/price`);
  return res.data;
}

export async function setBasePrice(flightId, price) {
  const res = await axios.post(`${BACKEND_URL}/pricing/flight/${encodeURIComponent(flightId)}/setBasePrice`, {
    price,
  });
  return res.data;
}

/* ----------------- Recommendations ----------------- */
export async function getRecommendations(userId, limit = 6) {
  const res = await axios.get(`${BACKEND_URL}/recommendations/${encodeURIComponent(userId)}?limit=${limit}`);
  return res.data;
}

export async function recordInteraction(body) {
  const res = await axios.post(`${BACKEND_URL}/recommendations/interactions`, body);
  return res.data;
}

export async function sendRecommendationFeedback(userId, body) {
  const res = await axios.post(`${BACKEND_URL}/recommendations/${encodeURIComponent(userId)}/feedback`, body);
  return res.data;
}

export async function recomputeRecommendations(userId, limit = 12) {
  const res = await axios.post(`${BACKEND_URL}/recommendations/${encodeURIComponent(userId)}/recompute?limit=${limit}`);
  return res.data;
}
