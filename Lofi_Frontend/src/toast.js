export function showToast(message, type = "success") {
  if (!document.getElementById("toast-styles")) {
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.innerHTML = `
      .toastPopup {
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255,255,255,0.1);
        color: white;
        padding: 12px 24px;
        border-radius: 30px;
        font-weight: 500;
        font-size: 14px;
        z-index: 9999;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        animation: slideDownFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .toastPopup.error { border-left: 4px solid #ef4444; }
      .toastPopup.success { border-left: 4px solid #1DB954; }
      .toastPopup.fade-out { animation: slideUpFade 0.3s ease-in forwards; }
      @keyframes slideDownFade {
        0% { top: -20px; opacity: 0; transform: translateX(-50%) scale(0.95); }
        100% { top: 20px; opacity: 1; transform: translateX(-50%) scale(1); }
      }
      @keyframes slideUpFade {
        0% { top: 20px; opacity: 1; }
        100% { top: -40px; opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  const div = document.createElement("div");
  div.className = `toastPopup ${type}`;
  div.innerText = message;
  document.body.appendChild(div);

  setTimeout(() => div.classList.add("fade-out"), 3000);
  setTimeout(() => div.remove(), 3400);
}
