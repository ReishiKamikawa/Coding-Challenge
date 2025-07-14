import React, { useState } from "react";
import "./InviteToBoardModal.css";

export default function InviteToBoardModal({ onClose }) {
  const [input, setInput] = useState("");

  const handleOverlayClick = e => {
    if (e.target.className === "invite-modal-overlay") {
      onClose();
    }
  };

  return (
    <div className="invite-modal-overlay" onClick={handleOverlayClick}>
      <div className="invite-modal-container">
        <div className="invite-modal-header">Invite to Board</div>
        <div className="invite-modal-input-row">
          <input
            className="invite-modal-input"
            type="text"
            placeholder="Email address or name"
            value={input}
            onChange={e => setInput(e.target.value)}
          />
          {input && (
            <button
              className="invite-modal-clear"
              onClick={() => setInput("")}
              aria-label="Clear"
            >
              ×
            </button>
          )}
        </div>
        <div className="invite-modal-link-row">
          <span>
            Invite someone to this Workspace with a link: <br />
            <a href="#" className="invite-modal-disable-link">Disable link</a>
          </span>
          <button className="invite-modal-copy-btn">
            <span className="invite-modal-copy-icon">$</span> Copy link
          </button>
        </div>
      </div>
    </div>
  );
}
