# 🎧 LoFocus / Lofi Productivity Space

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![Spring Boot](https://img.shields.io/badge/spring_boot-%236DB33F.svg?style=for-the-badge&logo=spring&logoColor=white)
![Spotify API](https://img.shields.io/badge/Spotify_API-1DB954?style=for-the-badge&logo=spotify&logoColor=white)

A hyper-immersive, aesthetics-first productivity dashboard engineered to help you achieve deep work. Blend Spotify automation, real-time STOMP-powered Study Rooms, and full-stack session management seamlessly inside beautiful animated environments.

## ✨ Features
* **Zero-Distraction Environment:** Perfectly crafted dark glassmorphic UI overlaying high-quality dynamically selectable video backgrounds.
* **Spotify Integration:** Directly connect your Premium or Free account using the official Spotify Developer APIs to auto-inject lo-fi beats into your workflow. 
* **Dynamic Pomodoro Engine:** A highly customizable session loop (Focus, Short Break, Long Break) tied dynamically to your UI.
* **Real-time Study Rooms:** Built with WebRTC and Spring Boot WebSockets (STOMP) to instantly generate un-trackable code-based peer-to-peer video rooms.
* **Synchronized To-Do Management:** A persistent API-driven notes log to track daily goals.

## 🛠 Tech Stack
**Frontend:** React 18, Vite, CSS3/Flexbox (Zero Component-Libraries for maximum performance)
**Backend:** Java Spring Boot, STOMP WebSockets, Spring MVC
**APIs:** Spotify Web API & OAuth2
**Hosting (Recommended):** Vercel (Client) + Railway (API/DB)

---

## 🚀 Setting up Locally

### 1. Frontend Setup
Navigate into the frontend project, install dependencies, and setup your environment tokens.
```bash
cd Lofi_Frontend
npm install
```
Create a `.env` file in the `Lofi_Frontend` folder and populate it with your Developer Tokens:
```env
VITE_API_BASE=http://127.0.0.1:8081
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
VITE_SPOTIFY_REDIRECT_URI=http://localhost:5174/callback
```
Start the development server:
```bash
npm run dev
```

### 2. Backend Setup
Navigate into the backend project, connect your local MySQL/H2 configuration, and run the server.
```bash
cd Lofi_Backend
# Using Maven Wrapper to spin up the Spring Boot server mapping to port 8081
./mvnw spring-boot:run
```

---

## 🎨 Design Philosophy
*This project strictly avoids heavily bloated UI libraries (like Tailwind or Material UI) in favor of raw semantic CSS. The result is a mathematically rigid, flawlessly optimized single-page application that renders glassmorphic `backdrop-filters` natively without any JS rendering lag.*

Built independently by **Prayag Mishra**, with architectural and engineering co-authorship provided by **Claude (LLM)**. Let's connect on [LinkedIn](https://linkedin.com/in/prayag23).
