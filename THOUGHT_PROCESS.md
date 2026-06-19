# Queue Cure '26 - Thought Process & Architecture Decisions

As a Senior Full Stack Engineer, here is the detailed thought process and system architecture decisions made during the development of Queue Cure.

## 1. Architecture Decisions

- **MERN Stack Choice:** Opted for React (via Vite for speed), Express, Node.js, and MongoDB. This is optimal for handling I/O heavy operations and real-time syncing.
- **Client-Server Separation:** Fully decoupled frontend and backend. This allows deploying the client to a global CDN (like Vercel) and the Node API to an edge/cloud service (like Render).
- **Socket.io Integration:** Standard HTTP requests are used for mutating data (adding a patient, changing status) to ensure reliable state persistence in the database first. Once the DB confirms the mutation, the backend emits Socket.io events. This "HTTP for writes, Sockets for reads/syncs" pattern prevents race conditions.

## 2. Queue Management Logic

- **Token Generation:** The system checks the total number of patients created "today" (since 12:00 AM) to generate a sequential token number. This resets naturally at midnight (can be extended with a cron job if needed).
- **Status Flow:** `Waiting` -> `In Consultation` -> `Completed`.
- **Calculating Estimated Wait Time:** The time is strictly calculated on the frontend during rendering to prevent stale data. It is determined by multiplying `waitingPatients.length` * `averageConsultationTime`. 

## 3. Real-Time Synchronization

- **Event-Driven Architecture:** The frontend uses React `useEffect` hooks to subscribe to socket events upon mounting. 
- **Handling Updates:** When an event like `TOKEN_CALLED` is triggered, the frontend receives the entire updated Patient object and updates the array via `map()`, ensuring React re-renders instantly without needing to refetch the entire list from the database.

## 4. Concurrency Handling & Edge Cases

- **Multiple Receptionists:** Using HTTP POST/PUT for actions acts as a gatekeeper. If two receptionists click "Call Next" simultaneously, MongoDB's atomic updates (or sequence of requests) process them linearly. The socket broadcasts the final state to everyone.
- **Refresh During Consultation:** The application fetches the entire queue payload on initial load (`GET /api/patients`). Thus, if the browser is refreshed, it rebuilds the exact real-time state from the DB before re-attaching socket listeners.
- **Socket Reconnect:** Socket.io has built-in long-polling fallback and auto-reconnection. If the waiting room loses Wi-Fi, it reconnects automatically.
- **Empty Queue & Resets:** Implemented a `resetQueue` endpoint and a `QUEUE_RESET` socket event to safely wipe the collection and instantly update all clients.

## 5. UI/UX and Scalability Considerations

- **Design System:** Utilized Tailwind CSS to create a modern, sleek healthcare aesthetic. Colors like primary Blue (`#2563EB`) and Teal (`#14B8A6`) were chosen for a trustworthy, calm, and clinical vibe.
- **Animations:** Used Framer Motion in the Waiting Room to ensure token transitions are smooth, maintaining visual attention without jarring the user.
- **Scalability:** For a hospital with thousands of patients, the `getPatients` endpoint can be paginated, and socket events can be namespaced per doctor/department. We used basic indexing on `createdAt` implicitly via the sorting logic.
