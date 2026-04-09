import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8081";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  // TURN relays — required for mobile/carrier NAT (symmetric NAT) connectivity
  {
    urls: [
      "turn:openrelay.metered.ca:80",
      "turn:openrelay.metered.ca:443",
      "turn:openrelay.metered.ca:443?transport=tcp",
    ],
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

function normalizeUsers(users) {
  if (!users) return [];
  if (Array.isArray(users)) return users;
  try { return Array.from(users); } catch { return []; }
}

export function useWebRTC() {
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────
  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState("pick"); // pick | waiting | call
  const [room, setRoom] = useState(null);
  const [codeInput, setCodeInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [callError, setCallError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const clientRef = useRef(null);
  const pendingActionRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const remoteStreamRef = useRef(new MediaStream());
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pendingIceRef = useRef([]);
  const pendingSignalsRef = useRef([]); // Buffer for signals arriving before PC is ready
  const remoteDescSetRef = useRef(false);
  const hasSentOfferRef = useRef(false);
  const signalSubRef = useRef({ code: null, subscribed: false });
  const currentRoomCodeRef = useRef("");

  const username = useMemo(() => {
    let u = sessionStorage.getItem("study_username");
    if (!u) { u = "user_" + Math.random().toString(36).slice(2, 7); sessionStorage.setItem("study_username", u); }
    return u;
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (localVideoRef.current) localVideoRef.current.srcObject = null;
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      localStreamRef.current = null; screenStreamRef.current = null;
      try { pcRef.current?.close(); } catch {}
      pcRef.current = null;
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
    const wsBase = API_BASE.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
    const stomp = new Client({
      brokerURL: `${wsBase}/ws-study-native`,
      reconnectDelay: 4000,
      debug: str => console.log("[stomp]", str),
      onConnect: () => {
        setConnected(true); setError("");
        stomp.subscribe("/topic/room-created", msg => {
          try { const r = JSON.parse(msg.body); if (normalizeUsers(r?.users).includes(username)) { setRoom(r); currentRoomCodeRef.current = r.code; } } catch {}
        });
        stomp.subscribe("/topic/room-joined", msg => {
          try { const r = JSON.parse(msg.body); if (normalizeUsers(r?.users).includes(username)) { setRoom(r); currentRoomCodeRef.current = r.code; } } catch {}
        });
        stomp.subscribe("/topic/room-left", msg => {
          try {
            const r = JSON.parse(msg.body);
            if (normalizeUsers(r?.users).includes(username)) { setRoom(r); currentRoomCodeRef.current = r.code; }
            else if (r.code === currentRoomCodeRef.current) setRoom(null);
          } catch {}
        });
        if (pendingActionRef.current) { pendingActionRef.current(stomp); pendingActionRef.current = null; }
      },
      onStompError: f => { setConnected(false); setError(f?.headers?.message || "STOMP error"); },
      onWebSocketError: () => { setConnected(false); setError("WebSocket error. Is the backend running?"); },
      onWebSocketClose: () => setConnected(false),
    });
    stomp.activate();
    clientRef.current = stomp;
    return () => { stomp.deactivate(); clientRef.current = null; };
  }, [username]);

  // ── Signal helpers ─────────────────────────────────────────────────────────
  const publishSignal = useCallback((code, type, payload) => {
    clientRef.current?.publish({ destination: `/app/signal/${code}`, body: JSON.stringify({ from: username, type, payload }) });
  }, [username]);

  const setupSignalSub = useCallback((code) => {
    const stomp = clientRef.current;
    if (!stomp?.connected) return;
    if (signalSubRef.current.code === code && signalSubRef.current.subscribed) return;
    stomp.subscribe(`/topic/room/${code}/signal`, async msg => {
      if (!msg?.body) return;
      let data; try { data = JSON.parse(msg.body); } catch { return; }
      if (data?.from === username) return;
      
      const { type, payload } = data;
      const pc = pcRef.current;
      
      // If PC isn't ready, buffer the signal
      if (!pc) {
        pendingSignalsRef.current.push(data);
        return;
      }

      try {
        if (type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          remoteDescSetRef.current = true;
          const answer = await pc.createAnswer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
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
  }, [username, publishSignal]);

  // ── Init WebRTC peer ───────────────────────────────────────────────────────
  const initPeer = useCallback(async (code, makeOffer) => {
    if (pcRef.current) return;
    setCallError("");
    remoteDescSetRef.current = false;
    pendingIceRef.current = [];
    hasSentOfferRef.current = false;
    remoteStreamRef.current = new MediaStream();

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS, iceTransportPolicy: "all" });
    pcRef.current = pc;

    // Process any buffered signals that arrived while we were initializing
    while (pendingSignalsRef.current.length) {
      const data = pendingSignalsRef.current.shift();
      const { type, payload } = data;
      try {
        if (type === "offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          remoteDescSetRef.current = true;
          const answer = await pc.createAnswer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
          await pc.setLocalDescription(answer);
          publishSignal(code, "answer", pc.localDescription);
        } else if (type === "answer") {
          await pc.setRemoteDescription(new RTCSessionDescription(payload));
          remoteDescSetRef.current = true;
        } else if (type === "ice") {
          if (!remoteDescSetRef.current) pendingIceRef.current.push(payload);
          else await pc.addIceCandidate(new RTCIceCandidate(payload));
        }
      } catch (e) { console.error("Buffered signal error:", e); }
    }

    pc.onicecandidate = e => { if (e.candidate) publishSignal(code, "ice", e.candidate); };

    pc.ontrack = e => {
      // Chrome: e.streams[0] is a managed stream — use directly
      // Firefox: e.streams[0] may be undefined — fall back to e.track
      let stream;
      if (e.streams?.[0]) {
        stream = e.streams[0];
        remoteStreamRef.current = stream;
      } else {
        remoteStreamRef.current.addTrack(e.track);
        stream = remoteStreamRef.current;
      }
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
        remoteVideoRef.current.play().catch(() => {});
      }
    };

    pc.oniceconnectionstatechange = () => {
      const s = pc.iceConnectionState;
      if (s === "connected" || s === "completed") {
        setCallError("");
        // Fallback: grab tracks from receivers if ontrack was missed
        const el = remoteVideoRef.current;
        if (el && !el.srcObject?.getVideoTracks()?.length) {
          const stream = new MediaStream();
          pc.getReceivers().forEach(r => { if (r.track) stream.addTrack(r.track); });
          if (stream.getTracks().length) { remoteStreamRef.current = stream; el.srcObject = stream; el.play().catch(() => {}); }
        }
      } else if (s === "failed") {
        pc.restartIce?.();
        setCallError("Connection issue — retrying…");
        setTimeout(() => setCallError(""), 3000);
      } else if (s === "disconnected") {
        setCallError("Partner disconnected.");
      }
    };

    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed"].includes(pc.connectionState)) setCallError("Peer disconnected.");
    };

    const isMobileUA = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const videoConstraints = isMobileUA
      ? { width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15, max: 20 } }
      : { width: { ideal: 1280, min: 640 }, height: { ideal: 720, min: 480 } };

    const stream = await navigator.mediaDevices.getUserMedia({
      video: videoConstraints,
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    if (makeOffer && !hasSentOfferRef.current) {
      hasSentOfferRef.current = true;
      const offer = await pc.createOffer({ offerToReceiveVideo: true, offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      publishSignal(code, "offer", pc.localDescription);
    }
  }, [publishSignal]);

  // ── React to room changes ──────────────────────────────────────────────────
  useEffect(() => {
    if (!room?.code) return;
    setupSignalSub(room.code);
    const users = normalizeUsers(room.users);
    if (!users.includes(username)) return;
    if (users.length < 2) {
      setPhase("waiting");
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null; remoteStreamRef.current = new MediaStream(); if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null; }
      return;
    }
    setPhase("call");
    const makeOffer = [...users].sort()[0] === username;
    initPeer(room.code, makeOffer).catch(e => setCallError(e?.message ?? "Media error"));
  }, [room, username, setupSignalSub, initPeer]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleCreate = () => {
    setError(""); setPhase("waiting");
    const action = client => client.publish({ destination: "/app/create", body: username });
    if (connected && clientRef.current?.connected) action(clientRef.current);
    else pendingActionRef.current = action;
  };

  const handleJoin = () => {
    setError("");
    const code = codeInput.trim();
    if (!code) { setError("Enter a room code."); return; }
    setPhase("waiting");
    const action = client => client.publish({ destination: "/app/join", body: JSON.stringify({ code, user: username }) });
    if (connected && clientRef.current?.connected) action(clientRef.current);
    else pendingActionRef.current = action;
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
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      if (camTrack) pcRef.current?.getSenders().find(s => s.track?.kind === "video")?.replaceTrack(camTrack);
      if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setScreenOn(false); return;
    }
    try {
      const ss = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      screenStreamRef.current = ss;
      const st = ss.getVideoTracks()[0];
      pcRef.current?.getSenders().find(s => s.track?.kind === "video")?.replaceTrack(st);
      if (localVideoRef.current) localVideoRef.current.srcObject = ss;
      st.onended = () => { setScreenOn(false); if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current; };
      setScreenOn(true);
    } catch {}
  };

  const stopCall = () => {
    if (room && clientRef.current?.connected) {
      clientRef.current.publish({ destination: "/app/leave", body: JSON.stringify({ code: room.code, user: username }) });
    }
    try { pcRef.current?.close(); } catch {}
    pcRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null; screenStreamRef.current = null;
    remoteStreamRef.current = new MediaStream();
    pendingIceRef.current = []; remoteDescSetRef.current = false; hasSentOfferRef.current = false;
    signalSubRef.current = { code: null, subscribed: false };
    setRoom(null); setPhase("pick"); setCodeInput(""); setError(""); setCallError("");
    setMicOn(true); setCamOn(true); setScreenOn(false);
    currentRoomCodeRef.current = "";
    navigate("/");
  };

  const copyCode = () => {
    if (room?.code) { navigator.clipboard.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  return {
    // state
    connected, phase, room, codeInput, setCodeInput,
    copied, error, callError, micOn, camOn, screenOn,
    // refs (for video elements)
    localVideoRef, remoteVideoRef, remoteStreamRef,
    // data
    username,
    // actions
    handleCreate, handleJoin, stopCall, copyCode,
    toggleMic, toggleCam, toggleScreen,
  };
}
