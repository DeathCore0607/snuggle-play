# SnugglePlay 💕

A minimalist, cute, "soft glass" web app for two people to watch together, screen share, chat, react, and rate tracks.

## Features
- **Minimalist & Cute UI**: Soft gradients, glassmorphism, and playful animations.
- **Real-time Sync**: Socket.IO powered room state, chat, and reactions.
- **WebRTC**: Peer-to-peer camera and screen sharing.
- **Activity Log**: Host-only view of room events.
- **Perfect Match**: Animated celebration when ratings match.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Real-time**: Socket.IO (Custom Server)
- **State**: Zustand
- **Icons**: Lucide React

## Setup & Running

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run Development Server**:
   ```bash
   npm run dev
   ```
   This starts the custom server on `http://localhost:3000`.

3. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## Development Notes
- **WebRTC**: Camera and screen sharing require HTTPS in production. On `localhost`, browsers allow it without HTTPS.
- **Socket.IO**: The server is integrated into Next.js via `src/server/server.ts`.
- **Environment Variables**:
  - `PORT`: (Optional) Port to run on (default 3000).
  - `STUN_URLS`: (Optional) Comma-separated STUN servers.

## Deployment
To deploy to platforms like Vercel, you need to support the custom server. **However, SnugglePlay uses a custom Node.js server for Socket.IO**, which isn't natively supported on Vercel Serverless functions for persistent connections.

**Recommended Deployment**:
- **Railway**, **Render**, or **VPS** (DigitalOcean, etc.) where you can run `npm start`.

## License
MIT
