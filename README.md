# Proof of Concept (PoC) - SSEand Redis Pub/Sub

This project is a Proof of Concept (PoC) demonstrating the use of Server-Sent Events (SSE) to communicate with the frontend. The backend services are distributed and managed through a load balancer, while inter-service communication is handled via Redis Pub/Sub.

## Features
- **SSE (Server-Sent Events)** for real-time communication with the frontend.
- **Load Balancer** to distribute requests across multiple backend services.
- **Redis Pub/Sub** for efficient inter-service messaging.

## Prerequisites
Before running the project, ensure you have the following installed:
- **Node.js**
- **Redis** running locally

## Installation
1. Clone this repository:

2. Install dependencies:
   ```sh
   npm install
   cd front && npm install
   ```

## Running the Project
1. Start Redis server locally.
2. Launch the backend:
   ```sh
   npm run dev
   ```
3. Launch the frontend:
   ```sh
   cd front
   npm run dev
   ```