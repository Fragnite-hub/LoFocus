import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import "./StudyRoomCall.css";
import { useNavigate } from "react-router-dom";
import "./StudyRoomCall.css";

// Connect directly to backend for SockJS/STOMP.
// Vite proxy can be flaky with SockJS websocket transport on some setups.
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8081";

function normalizeUsers(users) {
  if (!users) return [];
  if (Array.isArray(users)) return users;
  if (users instanceof Set) return Array.from(users);
  try { return Array.from(users); } catch { return []; }
}

// ─── Inject styles once ───────────────────────────────────────────────────────
const STYLE_ID = "src-styles-v2";
function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement("style");
  el.id = STYLE_ID;
  el.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500&display=swap');

    /* ── OVERLAY ── */
    .src-backdrop {
      position: fixed; inset: 0; z-index: 8888;
      background: rgba(2, 4, 18, 0.82);
      backdrop-filter: blur(18px) saturate(1.4);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Outfit', sans-serif;
      animation: srcFadeIn .22s ease;
    }
    @keyframes srcFadeIn { from{opacity:0} to{opacity:1} }

    /* ── LOBBY CARD ── */
    .src-lobby {
      width: 420px; max-width: 96vw;
      background: linear-gradient(160deg, #0c0e24 0%, #080a1e 100%);
      border: 1px solid rgba(99,102,241,.22);
      border-radius: 24px;
      padding: 40px 36px;
      box-shadow: 0 0 0 1px rgba(255,255,255,.035),
                  0 32px 80px rgba(0,0,0,.6),
                  0 0 60px rgba(99,102,241,.12);
      animation: srcSlide .3s cubic-bezier(.34,1.56,.64,1);
      position: relative;
    }
    @keyframes srcSlide { from{transform:translateY(20px);opacity:0} to{transform:translateY(0);opacity:1} }

    .src-close-btn {
      position: absolute; top: 16px; right: 16px;
      width: 30px; height: 30px; border-radius: 8px;
      border: none; background: rgba(255,255,255,.06);
      color: rgba(255,255,255,.45); font-size: 16px;
      cursor: pointer; display: flex; align-items:center; justify-content:center;
      transition: background .15s, color .15s;
    }
    .src-close-btn:hover { background: rgba(255,255,255,.12); color: #fff; }

    .src-eyebrow {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px; font-weight: 400; letter-spacing: 2.5px;
      text-transform: uppercase; color: rgba(99,102,241,.8);
      margin: 0 0 10px;
    }
    .src-heading {
      font-size: 28px; font-weight: 800; letter-spacing: -0.8px;
      color: #fff; margin: 0 0 6px;
      text-shadow: 0 0 40px rgba(99,102,241,.35);
    }
    .src-sub {
      font-size: 13px; color: rgba(255,255,255,.3);
      font-family: 'JetBrains Mono', monospace;
      margin: 0 0 30px; line-height: 1.5;
    }

    /* tabs */
    .src-tabs { display:flex; gap:6px; margin-bottom:28px; }
    .src-tab {
      flex:1; padding:9px 0; border-radius:10px;
      border: 1px solid rgba(255,255,255,.08);
      background: transparent; color: rgba(255,255,255,.35);
      font-family:'Outfit',sans-serif; font-size:13px; font-weight:600;
      cursor:pointer; transition: all .18s;
    }
    .src-tab:hover { border-color:rgba(99,102,241,.4); color:rgba(255,255,255,.7); }
    .src-tab.src-tab--active {
      background: rgba(99,102,241,.14);
      border-color: rgba(99,102,241,.5);
      color: #818cf8;
    }

    /* field */
    .src-field-label {
      font-size:10px; font-weight:700; letter-spacing:1.5px;
      text-transform:uppercase; color:rgba(255,255,255,.28);
      margin-bottom:7px;
      font-family:'JetBrains Mono',monospace;
    }
    .src-field {
      width:100%; padding:11px 14px; border-radius:10px;
      border:1px solid rgba(255,255,255,.09);
      background:rgba(255,255,255,.04); color:#fff;
      font-family:'JetBrains Mono',monospace; font-size:15px; font-weight:400;
      outline:none; box-sizing:border-box; transition:border-color .18s;
      letter-spacing:2px;
    }
    .src-field:focus { border-color:rgba(99,102,241,.5); }
    .src-field::placeholder { color:rgba(255,255,255,.2); letter-spacing:0; }
    .src-field-wrap { margin-bottom:20px; }

    /* primary btn */
    .src-btn {
      width:100%; padding:13px; border-radius:12px; border:none;
      background:linear-gradient(135deg,#4f46e5,#6366f1);
      color:#fff; font-family:'Outfit',sans-serif;
      font-size:15px; font-weight:700; cursor:pointer;
      transition: all .2s;
      box-shadow: 0 4px 20px rgba(79,70,229,.4), 0 1px 0 rgba(255,255,255,.1) inset;
    }
    .src-btn:hover { transform:translateY(-1px); box-shadow:0 6px 30px rgba(79,70,229,.55), 0 1px 0 rgba(255,255,255,.1) inset; }
    .src-btn:active { transform:translateY(0); }
    .src-btn:disabled { opacity:.35; cursor:not-allowed; transform:none; }

    /* code display */
    .src-code-box {
      background: rgba(99,102,241,.07);
      border: 1px dashed rgba(99,102,241,.3);
      border-radius: 14px; padding:22px 20px; text-align:center;
      margin-bottom:22px;
    }
    .src-code-val {
      font-family:'JetBrains Mono',monospace;
      font-size:30px; font-weight:500; color:#818cf8;
      letter-spacing:5px; display:block;
    }
    .src-code-hint {
      font-size:11px; color:rgba(255,255,255,.25);
      font-family:'JetBrains Mono',monospace;
      margin-top:7px; display:block;
    }
    .src-copy-btn {
      margin-top:12px; padding:6px 16px; border-radius:20px;
      border:1px solid rgba(99,102,241,.3); background:transparent;
      color:#818cf8; font-size:11px;
      font-family:'JetBrains Mono',monospace;
      cursor:pointer; transition:all .18s;
    }
    .src-copy-btn:hover { background:rgba(99,102,241,.15); }

    .src-error {
      font-family:'JetBrains Mono',monospace; font-size:11px; color:#f87171;
      margin:-12px 0 16px; line-height:1.5;
    }
    .src-desc {
      font-size:13px; color:rgba(255,255,255,.32); line-height:1.6;
      margin-bottom:22px; font-family:'JetBrains Mono',monospace;
    }

    /* ── WAITING STATE ── */
    .src-waiting {
      text-align:center; padding:12px 0 4px;
    }
    .src-pulse-ring {
      width:52px; height:52px; border-radius:50%;
      border:2px solid rgba(99,102,241,.4);
      margin:0 auto 14px;
      display:flex; align-items:center; justify-content:center;
      animation:srcRing 2s ease-in-out infinite;
      font-size:22px;
    }
    @keyframes srcRing {
      0%,100%{box-shadow:0 0 0 0 rgba(99,102,241,.4)}
      50%{box-shadow:0 0 0 12px rgba(99,102,241,0)}
    }
    .src-waiting-title {
      font-size:15px; font-weight:600; color:rgba(255,255,255,.8); margin:0 0 6px;
    }
    .src-waiting-sub {
      font-size:12px; color:rgba(255,255,255,.3);
      font-family:'JetBrains Mono',monospace;
    }

    /* ── FULL SCREEN ROOM ── */
    .src-room {
      position:fixed; inset:0; z-index:8888;
      background:#03040f;
      font-family:'Outfit',sans-serif;
      display:flex; flex-direction:column;
    }

    .src-room-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:12px 22px;
      border-bottom:1px solid rgba(255,255,255,.055);
      background:rgba(255,255,255,.018);
      flex-shrink:0;
    }
    .src-room-left { display:flex; align-items:center; gap:14px; }
    .src-live-dot {
      width:8px; height:8px; border-radius:50%; background:#34d399;
      animation:srcPulseDot 2s infinite;
      box-shadow:0 0 8px rgba(52,211,153,.6);
    }
    @keyframes srcPulseDot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.6;transform:scale(.85)} }
    .src-room-name { font-size:15px; font-weight:700; color:rgba(255,255,255,.85); }
    .src-room-badge {
      font-family:'JetBrains Mono',monospace; font-size:12px; color:#818cf8;
      background:rgba(99,102,241,.1); border:1px solid rgba(99,102,241,.2);
      padding:3px 12px; border-radius:20px; letter-spacing:2px;
    }
    .src-share-code-btn {
      padding:5px 13px; border-radius:16px;
      border:1px solid rgba(255,255,255,.1); background:transparent;
      color:rgba(255,255,255,.4); font-size:11px;
      font-family:'JetBrains Mono',monospace;
      cursor:pointer; transition:all .18s;
    }
    .src-share-code-btn:hover { border-color:rgba(99,102,241,.4); color:#818cf8; }
    .src-leave-btn {
      padding:7px 16px; border-radius:8px;
      border:1px solid rgba(239,68,68,.25);
      background:rgba(239,68,68,.07); color:#f87171;
      font-family:'Outfit',sans-serif; font-size:13px; font-weight:600;
      cursor:pointer; transition:all .18s;
    }
    .src-leave-btn:hover { background:rgba(239,68,68,.16); border-color:rgba(239,68,68,.4); }

    /* videos grid */
    .src-videos {
      flex:1; display:flex; gap:12px; padding:16px;
      overflow:hidden; align-items:stretch;
    }
    .src-videos.src-videos--1 .src-vtile { flex:1; }
    .src-videos.src-videos--2 .src-vtile { flex:1; }

    .src-vtile {
      position:relative; border-radius:16px; overflow:hidden;
      background:#0b0d20;
      border:1px solid rgba(255,255,255,.07);
      min-height:200px;
    }
    .src-vtile video {
      width:100%; height:100%; object-fit:cover; display:block;
    }
    .src-vtile--screen video { object-fit:contain; background:#000; }

    .src-vtile-label {
      position:absolute; bottom:10px; left:12px;
      background:rgba(0,0,0,.55); backdrop-filter:blur(8px);
      color:#fff; font-size:11px; font-weight:500;
      font-family:'JetBrains Mono',monospace;
      padding:3px 10px; border-radius:20px;
      display:flex; align-items:center; gap:6px;
    }
    .src-mute-badge {
      position:absolute; top:10px; right:10px;
      background:rgba(239,68,68,.65); backdrop-filter:blur(4px);
      color:#fff; width:26px; height:26px; border-radius:50%;
      display:flex; align-items:center; justify-content:center;
      font-size:12px;
    }
    .src-screen-badge {
      position:absolute; top:10px; left:12px;
      background:rgba(99,102,241,.6); backdrop-filter:blur(4px);
      color:#fff; font-size:10px; font-family:'JetBrains Mono',monospace;
      padding:3px 10px; border-radius:20px; letter-spacing:1px;
    }

    /* waiting inside room */
    .src-room-wait {
      flex:1; display:flex; flex-direction:column;
      align-items:center; justify-content:center; gap:14px;
    }
    .src-room-wait-icon { font-size:42px; opacity:.4; }
    .src-room-wait-text {
      font-size:14px; color:rgba(255,255,255,.3);
      font-family:'JetBrains Mono',monospace;
    }
    .src-room-code-large {
      font-family:'JetBrains Mono',monospace; font-size:26px; font-weight:500;
      color:#818cf8; letter-spacing:5px;
    }

    /* controls bar */
    .src-controls {
      display:flex; align-items:center; justify-content:center; gap:10px;
      padding:14px 22px;
      border-top:1px solid rgba(255,255,255,.055);
      background:rgba(255,255,255,.015);
      flex-shrink:0;
    }
    .src-ctrl {
      width:46px; height:46px; border-radius:50%;
      border:1px solid rgba(255,255,255,.1);
      background:rgba(255,255,255,.06); color:rgba(255,255,255,.75);
      font-size:17px; cursor:pointer; transition:all .18s;
      display:flex; align-items:center; justify-content:center;
    }
    .src-ctrl:hover { background:rgba(255,255,255,.12); color:#fff; }
    .src-ctrl--off { background:rgba(239,68,68,.15); border-color:rgba(239,68,68,.35); color:#f87171; }
    .src-ctrl--off:hover { background:rgba(239,68,68,.25); }
    .src-ctrl--active { background:rgba(99,102,241,.18); border-color:rgba(99,102,241,.4); color:#818cf8; }
    .src-ctrl--active:hover { background:rgba(99,102,241,.28); }
    .src-ctrl--end { width:50px; height:50px; font-size:19px; background:rgba(239,68,68,.2); border-color:rgba(239,68,68,.45); color:#f87171; }
    .src-ctrl--end:hover { background:rgba(239,68,68,.35); }

    .src-room-error {
      position:absolute; bottom:78px; left:50%; transform:translateX(-50%);
      background:rgba(239,68,68,.12); border:1px solid rgba(239,68,68,.25);
      color:#f87171; font-family:'JetBrains Mono',monospace; font-size:11px;
      padding:7px 16px; border-radius:20px; white-space:nowrap;
    }
  `;
  document.head.appendChild(el);
}

// ─── Main Component ───────────────────────────────────────────────────────────
//export default function StudyRoomCall({ open, onClose }) {
export default function StudyRoomCall() {
  // Styles are now in StudyRoomCall.css
  injectStyles();

  const [connected, setConnected] = useState(false);
  const [tab, setTab] = useState("create"); // create | join
  const [phase, setPhase] = useState("pick"); // pick | waiting | call
  const [room, setRoom] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [callError, setCallError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);

  const username = useMemo(() => {
    let u = sessionStorage.getItem("study_username");
    if (!u) {
      u = "user_" + Math.random().toString(36).slice(2, 7);
      sessionStorage.setItem("study_username", u);
    }
    return u;
  }, []);
  const clientRef = useRef(null);
  const pendingActionRef = useRef(null); // queued action to fire once connected
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pendingIceRef = useRef([]);
  const remoteDescSetRef = useRef(false);
  const hasSentOfferRef = useRef(false);
  const signalSubRef = useRef({ code: null, subscribed: false });
  const currentRoomCodeRef = useRef("");
  const navigate = useNavigate();

  // ── Cleanup on unmount (navigating away without pressing Leave) ────────────
  useEffect(() => {
    return () => {
      // Stop all media tracks so the camera/mic indicator turns off immediately
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      screenStreamRef.current = null;
      // Close peer connection
      try { pcRef.current?.close(); } catch {}
      pcRef.current = null;
      // Notify backend we left (best-effort)
      if (currentRoomCodeRef.current && clientRef.current?.connected) {
        clientRef.current.publish({
          destination: "/app/leave",
          body: JSON.stringify({ code: currentRoomCodeRef.current, user: sessionStorage.getItem("study_username") }),
        });
      }
    };
  }, []);

  // ── STOMP connect ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Prefer native websocket STOMP endpoint (more reliable than SockJS on your machine).
    const wsBase = (import.meta.env.VITE_API_BASE ?? "http://localhost:8081")
      .replace(/^http:/, "ws:")
      .replace(/^https:/, "wss:");

    const stomp = new Client({
      brokerURL: `${wsBase}/ws-study-native`,
      reconnectDelay: 4000,
      debug: (str) => {
        // eslint-disable-next-line no-console
        console.log("[stomp]", str);
      },
      onConnect: () => {
        setConnected(true);
        setError("");
        stomp.subscribe("/topic/room-created", (msg) => {
          try {
            const r = JSON.parse(msg.body);
            if (normalizeUsers(r?.users).includes(username)) {
              setRoom(r);
              currentRoomCodeRef.current = r.code;
            }
          } catch {}
        });
        stomp.subscribe("/topic/room-joined", (msg) => {
          try {
            const r = JSON.parse(msg.body);
            if (normalizeUsers(r?.users).includes(username)) {
              setRoom(r);
              currentRoomCodeRef.current = r.code;
            }
          } catch {}
        });
        stomp.subscribe("/topic/room-left", (msg) => {
          try {
            const r = JSON.parse(msg.body);
            if (normalizeUsers(r?.users).includes(username)) {
              setRoom(r);
              currentRoomCodeRef.current = r.code;
            } else if (r.code === currentRoomCodeRef.current) {
              setRoom(null);
            }
          } catch {}
        });
        if (pendingActionRef.current) {
          pendingActionRef.current(stomp);
          pendingActionRef.current = null;
        }
      },
      onStompError: (frame) => {
        setConnected(false);
        setError(frame?.headers?.message || "STOMP error");
      },
      onWebSocketError: () => {
        setConnected(false);
        setError("WebSocket error. Ensure backend is running on 8081 and restart frontend.");
      },
      onWebSocketClose: () => {
        setConnected(false);
      },
    });

    stomp.activate();
    clientRef.current = stomp;
    return () => {
      stomp.deactivate();
      clientRef.current = null;
    };
  }, [username]);

  // ── Signal subscription ────────────────────────────────────────────────────
  const setupSignalSub = useCallback((code) => {
    const stomp = clientRef.current;
    if (!stomp || !stomp.connected) return;
    if (signalSubRef.current.code === code && signalSubRef.current.subscribed) return;

    stomp.subscribe(`/topic/room/${code}/signal`, async (msg) => {
      if (!msg?.body) return;
      let data; try { data = JSON.parse(msg.body); } catch { return; }
      if (data?.from === username) return;
      const pc = pcRef.current;
      if (!pc) return;
      const { type, payload } = data;
      try {
        if (type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          remoteDescSetRef.current = true;
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          publishSignal(code, "answer", pc.localDescription);
          while (pendingIceRef.current.length) await pc.addIceCandidate(new RTCIceCandidate(pendingIceRef.current.shift()));
        } else if (type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          remoteDescSetRef.current = true;
          while (pendingIceRef.current.length) await pc.addIceCandidate(new RTCIceCandidate(pendingIceRef.current.shift()));
        } else if (type === "ice") {
          if (!remoteDescSetRef.current) pendingIceRef.current.push(payload);
          else await pc.addIceCandidate(new RTCIceCandidate(payload));
        }
      } catch (e) { setCallError(e?.message ?? "Signal error"); }
    });
    signalSubRef.current = { code, subscribed: true };
  }, [username]);

  const publishSignal = (code, type, payload) => {
    clientRef.current?.publish({
      destination: `/app/signal/${code}`,
      body: JSON.stringify({ from: username, type, payload }),
    });
  };

  // ── Init WebRTC ────────────────────────────────────────────────────────────
  const initPeer = useCallback(async (code, makeOffer) => {
    if (pcRef.current) return;
    setCallError("");
    remoteDescSetRef.current = false;
    pendingIceRef.current = [];
    hasSentOfferRef.current = false;
    remoteStreamRef.current = new MediaStream();

    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;

    pc.onicecandidate = (e) => { if (e.candidate) publishSignal(code, "ice", e.candidate); };

    pc.ontrack = (e) => {
      const stream = e.streams?.[0];
      if (stream) stream.getTracks().forEach((t) => remoteStreamRef.current.addTrack(t));
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remoteStreamRef.current;
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected","failed"].includes(pc.connectionState)) {
        setCallError("Peer disconnected.");
      }
    };

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    if (makeOffer && !hasSentOfferRef.current) {
      hasSentOfferRef.current = true;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      publishSignal(code, "offer", pc.localDescription);
    }
  }, []);

  // ── React to room changes ──────────────────────────────────────────────────
  useEffect(() => {
    if (!room?.code) return;
    setupSignalSub(room.code);
    const users = normalizeUsers(room.users);
    if (!users.includes(username)) return;

    if (users.length < 2) { 
      setPhase("waiting"); 
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
        remoteStreamRef.current = new MediaStream();
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      }
      return; 
    }

    setPhase("call");
    const makeOffer = [...users].sort()[0] === username;
    initPeer(room.code, makeOffer).catch((e) => setCallError(e?.message ?? "Media error"));
  }, [room, username, setupSignalSub, initPeer]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleCreate = () => {
    setError("");
    setPhase("waiting");
    const action = (client) => client.publish({ destination: "/app/create", body: username });
    if (connected && clientRef.current?.connected) {
      action(clientRef.current);
    } else {
      pendingActionRef.current = action;
    }
  };

  const handleJoin = () => {
    setError("");
    // Backend room codes are generated as UUID substrings (lowercase).
    // Do NOT uppercase here or join will fail.
    const code = codeInput.trim();
    if (!code) { setError("Enter a room code."); return; }
    setPhase("waiting");
    const action = (client) => client.publish({
      destination: "/app/join",
      body: JSON.stringify({ code, user: username }),
    });
    if (connected && clientRef.current?.connected) {
      action(clientRef.current);
    } else {
      pendingActionRef.current = action;
    }
  };

  const toggleMic = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setMicOn(t.enabled); }
  };

  const toggleCam = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setCamOn(t.enabled); }
  };

  const toggleScreen = async () => {
    if (screenOn) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) {
        pcRef.current?.getSenders().find((s) => s.track?.kind === "video")?.replaceTrack(camTrack);
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setScreenOn(false);
      return;
    }
    try {
      const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = ss;
      const st = ss.getVideoTracks()[0];
      pcRef.current?.getSenders().find((s) => s.track?.kind === "video")?.replaceTrack(st);
      if (localVideoRef.current) localVideoRef.current.srcObject = ss;
      st.onended = () => { setScreenOn(false); if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current; };
      setScreenOn(true);
    } catch {}
  };

  const stopCall = () => {
    if (room && clientRef.current?.connected) {
      clientRef.current.publish({
        destination: "/app/leave",
        body: JSON.stringify({ code: room.code, user: username })
      });
    }
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null; screenStreamRef.current = null;
    remoteStreamRef.current = new MediaStream();
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    pendingIceRef.current = []; remoteDescSetRef.current = false; hasSentOfferRef.current = false;
    signalSubRef.current = { code: null, subscribed: false };
    setRoom(null); setPhase("pick"); setCodeInput(""); setError(""); setCallError("");
    setMicOn(true); setCamOn(true); setScreenOn(false);
    currentRoomCodeRef.current = "";
    //onClose?.();
    navigate("/");
  };

  const copyCode = () => {
    if (room?.code) { navigator.clipboard.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  //if (!open) return null;

  // ── ROOM (call or waiting inside room) ────────────────────────────────────
  if (room) {
    return (
      <div className="src-room">
        <div className="src-room-header">
          <div className="src-room-left">
            <div className="src-live-dot" />
            <span className="src-room-name">Study Room</span>
            <span className="src-room-badge">{room.code}</span>
          </div>
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <button className="src-share-code-btn" onClick={copyCode}>
              {copied ? "✓ copied!" : "share code"}
            </button>
            <button className="src-leave-btn" onClick={stopCall}>Leave</button>
          </div>
        </div>

        {phase === "waiting" && (
          <div className="src-room-wait">
            <div className="src-room-wait-icon">👥</div>
            <div className="src-room-code-large">{room.code}</div>
            <div className="src-room-wait-text">share this code — waiting for your study buddy…</div>
          </div>
        )}

        {phase === "call" && (
          <div className={`src-videos src-videos--2`}>
            <div className={`src-vtile${screenOn ? " src-vtile--screen" : ""}`}>
              {screenOn && <div className="src-screen-badge">SCREEN</div>}
              <video ref={localVideoRef} autoPlay muted playsInline />
              <div className="src-vtile-label">
                <span>You ({username})</span>
              </div>
              {!micOn && <div className="src-mute-badge">🔇</div>}
            </div>
            <div className="src-vtile">
              <video ref={remoteVideoRef} autoPlay playsInline />
              <div className="src-vtile-label">Partner</div>
            </div>
          </div>
        )}

        {callError && <div className="src-room-error">{callError}</div>}

        <div className="src-controls">
          <button className={`src-ctrl${!micOn ? " src-ctrl--off" : ""}`} onClick={toggleMic} title="Toggle mic">
            {micOn ? "🎙" : "🔇"}
          </button>
          <button className={`src-ctrl${!camOn ? " src-ctrl--off" : ""}`} onClick={toggleCam} title="Toggle camera">
            {camOn ? "📷" : "🚫"}
          </button>
          <button className={`src-ctrl${screenOn ? " src-ctrl--active" : ""}`} onClick={toggleScreen} title="Screen share">
            🖥
          </button>
          <button className="src-ctrl src-ctrl--end" onClick={stopCall} title="Leave call">
            📞
          </button>
        </div>
      </div>
    );
  }

  // ── LOBBY MODAL ───────────────────────────────────────────────────────────
  return (
    <div className="src-room-page">
      <div className="src-lobby">
        <button className="src-close-btn" onClick={() => navigate("/")}>✕</button>

        <p className="src-eyebrow">lofi study</p>
        <h2 className="src-heading">Study Room</h2>
        <p className="src-sub">study together · stay focused · no distractions</p>

        {!connected && (
          <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:16, marginTop:0 }}>
            ⟳ connecting…
          </p>
        )}

        {/* Phase: pick */}
        {phase === "pick" && (
          <>
            <div className="src-tabs">
              <button className="src-tab" onClick={handleCreate} title="Create a new room instantly">
                ✦ Create Room
              </button>
              <button className="src-tab src-tab--active" style={{ cursor: "default" }}>
                → Join Room
              </button>
            </div>

            <div style={{ marginTop: "16px" }}>
              <div className="src-field-wrap">
                <div className="src-field-label">Room Code</div>
                <input
                  className="src-field"
                  placeholder="e.g. AB3X9KF2"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  maxLength={8}
                />
              </div>
              {error && <p className="src-error">{error}</p>}
              <button className="src-btn" onClick={handleJoin} disabled={!codeInput.trim()}>
                Join via Code
              </button>
            </div>
          </>
        )}

        {/* Phase: waiting (before room object arrives) */}
        {phase === "waiting" && (
          <div className="src-waiting">
            <div className="src-pulse-ring">⏳</div>
            <p className="src-waiting-title">Setting up your room…</p>
            <p className="src-waiting-sub">connecting to server</p>
          </div>
        )}
      </div>
    </div>
  );
}
