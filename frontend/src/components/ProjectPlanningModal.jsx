import React, { useState, useEffect } from "react";
import "./ProjectPlanningModal.css";

export default function ProjectPlanningModal({ onClose, task, boardId, cardId }) {
    const [selectedAttach, setSelectedAttach] = useState(null);
    const [taskDetails, setTaskDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTaskDetails = async () => {
            if (!task?.id || !boardId || !cardId) {
                setLoading(false);
                return;
            }

            try {
                const token = localStorage.getItem('auth_token');
                const response = await fetch(
                    `http://localhost:3000/boards/${boardId}/cards/${cardId}/tasks/${task.id}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );
                if (!response.ok) {
                    throw new Error('Failed to fetch task details');
                }
                const data = await response.json();
                setTaskDetails(data);
            } catch (error) {
                console.error('Error fetching task details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTaskDetails();
    }, [boardId, cardId, task]);

    const handleAttachClick = (buttonName) => {
        setSelectedAttach(buttonName === selectedAttach ? null : buttonName);
    };

    const handleOverlayClick = (e) => {
        if (e.target.className === 'modal-overlay') {
            onClose();
        }
    };

    if (loading) {
        return <div className="modal-overlay">
            <div className="modal-container loading-container">
                <div className="loading-text">Loading...</div>
            </div>
        </div>;
    }


    if (!task) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className="modal-container">
                <button className="modal-close" onClick={onClose}>
                    ×
                </button>
                <div className="modal-header">
                    <div className="header-content">
                        <div className="title-group">
                            <span className="modal-title">{task.title}</span>
                            <div className="modal-subtitle">in list {task.cardName}</div>
                        </div>
                    </div>
                </div>
                <div className="modal-row">
                    <div className="modal-section">
                        <div className="members-notification-group">
                            <div className="members-column">
                                <span className="modal-label">Members</span>
                                <div className="modal-group">
                                    <span className="avatar-circle">SD</span>
                                    <button className="modal-btn modal-btn-circle">+</button>
                                </div>
                            </div>
                            <div className="notification-column">
                                <span className="modal-label">Notifications</span>
                                <button className="modal-btn watch-btn">Watch</button>
                            </div>
                        </div>
                        <div className="modal-divider"></div>
                        <div>
                            <span className="modal-label">
                                <span className="modal-label-icon">📋</span> Description
                            </span>
                            <div className="modal-desc-box">
                                {taskDetails?.description || 'Add a more detailed description'}
                            </div>
                        </div>
                        <div className="modal-divider"></div>
                        <div>
                            <span className="modal-label">
                                <span className="modal-label-icon">📋</span> Activity
                                {taskDetails?.status && (
                                    <span className="task-status">• {taskDetails.status}</span>
                                )}
                            </span>
                            <div className="created-at">
                                Created {new Date(taskDetails?.createdAt).toLocaleString()}
                            </div>
                            <button className="modal-btn show-details-btn">Show details</button>
                            <div className="modal-activity-row">
                                <span className="avatar-circle">SD</span>
                                <input
                                    className="modal-comment-input"
                                    placeholder="Write a comment"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="modal-section-right">
                        <div className="modal-side-group">
                            <div className="side-section">
                                <div className="side-header">Add to card</div>
                                <button className="modal-side-btn full-width">
                                    <span className="btn-icon">👥</span>
                                    Members
                                </button>
                            </div>
                            <div className="side-section">
                                <div className="side-header">Power-Ups</div>
                                <button className="modal-side-btn full-width">
                                    <span className="btn-icon">🐙</span>
                                    GitHub
                                </button>
                            </div>
                            <div className="attach-section">
                                <button
                                    className={`modal-side-btn attach-btn ${selectedAttach === 'branch' ? 'selected' : ''}`}
                                    onClick={() => handleAttachClick('branch')}
                                >
                                    Attach Branch
                                </button>
                                <button
                                    className={`modal-side-btn attach-btn ${selectedAttach === 'commit' ? 'selected' : ''}`}
                                    onClick={() => handleAttachClick('commit')}
                                >
                                    Attach Commit
                                </button>
                                <button
                                    className={`modal-side-btn attach-btn ${selectedAttach === 'issue' ? 'selected' : ''}`}
                                    onClick={() => handleAttachClick('issue')}
                                >
                                    Attach Issue
                                </button>
                                <button
                                    className={`modal-side-btn attach-btn ${selectedAttach === 'pull' ? 'selected' : ''}`}
                                    onClick={() => handleAttachClick('pull')}
                                >
                                    Attach Pull Request...
                                </button>
                            </div>
                            <button className="modal-side-btn archive-btn">Archive</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}