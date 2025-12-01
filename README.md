# MakeMyTrip Clone – Travel Booking System    
Deployment link: [MakeMyTrip Clone](https://make-my-trip-clone-springboot-1-689o.onrender.com)

A full-stack MakeMyTrip-inspired travel booking platform with bookings, cancellations, reviews, seat selection, dynamic pricing, and AI-based recommendations.

## Overview

This project is a complete travel booking system built using React, Spring Boot, and MongoDB, designed to simulate core MakeMyTrip functionality.

It includes:

- Real-time seat updates
- Cancellation & refund workflows
- Dynamic pricing & surge logic
- Reviews & ratings
- AI-driven recommendations

---
## Features
### 1. Cancellation & Refund System

- Cancel bookings via dashboard
- Auto-refund based on policy (time-based %)
- Partial refund logic
- Refund status tracker
- Cancellation reason dropdown

### 2. Review & Rating Module

- 1–5 star ratings
- Write reviews + upload photos
- Reply to reviews
- Flag inappropriate reviews
- Sort by helpfulness or recent

### 3. Live Flight Status (Mock API)

- Real-time flight status updates
- Mock delay data (e.g., “Delayed by 1 hr”)
- Updated ETA and delay reason
- SSE (Server-Sent Events) based streaming

### 4. Seat & Room Selection

- Interactive seat map

- Color-coded seats:

   🟢 Available
   🟡 Premium
   🔴 Reserved

- Premium seat upsell popup
- Saves user preferences
- Real-time updates using SSE

### 5. Dynamic Pricing Engine

- Auto-adjusting prices based on demand
- Holiday surge pricing
- Price history & graphs
- “Price Freeze” feature

### 6. AI Recommendations

- Smart recommendations based on user history
- Collaborative filtering (mock logic)
- “Why this recommendation?” explanation
- Feedback loop
----

## Tech Stack
### Frontend

- React
- TypeScript
- TailwindCSS
- React


### Backend

- Spring Boot (Java)
- REST API
- Server-Sent Events (SSE)
- MongoDB


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn-pages-router) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.
