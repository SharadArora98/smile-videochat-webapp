# Smile Video Chat WebApp

A professional, real-time WebRTC-based video chat application featuring high-quality peer-to-peer communication, signaling via Socket.io, and a modern CI/CD pipeline.

## Features
- **Real-time Video/Audio:** Peer-to-peer communication using WebRTC.
- **Signaling Server:** Robust signaling handled via Node.js and Socket.io.
- **Containerized:** Fully Dockerized for consistent deployment.
- **CI/CD Integrated:** Automated build and push to GitHub Container Registry (GHCR).

## Tech Stack
- **Frontend:** JavaScript (ES6+), Vite, CSS3, HTML5.
- **Backend:** Node.js, Socket.io.
- **DevOps:** Docker, GitHub Actions, GitHub Container Registry.

## Getting Started

### Local Development
1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **Build for production:**
   ```bash
   npm run build
   ```

### Running with Docker
You can run the entire application using Docker to ensure environment parity:

1. **Build the image:**
   ```bash
   docker build -t smile-videochat .
   ```
2. **Run the container:**
   ```bash
   docker run -p 8080:8080 smile-videochat
   ```

## CI/CD & Deployment
This project uses **GitHub Actions** for Continuous Integration and Continuous Deployment.

- **Pipeline:** On every push to `main`, a workflow builds a multi-stage Docker image and pushes it to **GitHub Container Registry (GHCR)**.
- **Security:** Utilizes scoped `GITHUB_TOKEN` permissions for secure, automated authentication.

## 📄 License
MIT
