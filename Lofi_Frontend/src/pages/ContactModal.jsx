import { useState } from "react";
import { showToast } from "../toast";

export default function ContactModal({ isOpen, onClose }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !message) {
      showToast("Please fill out all fields.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("https://formspree.io/f/mnjowqvo", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, message })
      });

      if (response.ok) {
        setIsSuccess(true);
        setTimeout(() => {
          onClose();
          setIsSuccess(false);
          setEmail("");
          setMessage("");
        }, 2000);
      } else {
        throw new Error("Failed to send");
      }
    } catch (error) {
      showToast("Failed to send message. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(3, 4, 15, 0.75)",
      backdropFilter: "blur(12px)",
      zIndex: 9999,
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "fadeIn 0.2s ease"
    }}>
      <div style={{
        background: "linear-gradient(150deg, #121429 0%, #080914 100%)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: "24px",
        padding: "36px 32px",
        width: "420px",
        maxWidth: "92vw",
        boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        color: "white",
        position: "relative",
        fontFamily: "'Outfit', sans-serif"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: "16px", right: "20px",
          background: "transparent", border: "none", color: "rgba(255,255,255,0.4)",
          fontSize: "18px", cursor: "pointer"
        }}>✕</button>

        {isSuccess ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>✨</div>
            <h2 style={{ fontSize: "20px", fontWeight: "700", marginBottom: "8px" }}>Message Sent!</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>Thanks for reaching out! Closing...</p>
          </div>
        ) : (
          <>
            <h2 style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: "700", color: "#fff", letterSpacing: "0.5px" }}>
               Send Feedback
            </h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", lineHeight: "1.6", marginBottom: "24px" }}>
              Got an idea, a feature request, or just want to connect? Drop a message anonymously below!
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "6px", fontWeight: "600" }}>Your Email (Optional, if you want a reply)</label>
                <input
                  type="email"
                  placeholder="hello@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={{
                    width: "100%", padding: "12px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "white", fontSize: "14px", outline: "none", boxSizing: "border-box"
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "rgba(255,255,255,0.7)", marginBottom: "6px", fontWeight: "600" }}>Message</label>
                <textarea
                  placeholder="Hey, I absolutely love the dashboard..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  rows="4"
                  required
                  style={{
                    width: "100%", padding: "12px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                    color: "white", fontSize: "14px", outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit"
                  }}
                />
              </div>

              <button type="submit" disabled={isSubmitting} style={{
                width: "100%", padding: "14px", borderRadius: "12px", border: "none",
                background: isSubmitting ? "gray" : "linear-gradient(135deg, #4f46e5, #6366f1)", color: "white", fontSize: "14px", fontWeight: "700",
                cursor: isSubmitting ? "not-allowed" : "pointer", transition: "all 0.2s ease", marginTop: "8px"
              }} onMouseOver={e => !isSubmitting && (e.currentTarget.style.transform = "scale(1.02)")} onMouseOut={e => !isSubmitting && (e.currentTarget.style.transform = "scale(1)")}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
