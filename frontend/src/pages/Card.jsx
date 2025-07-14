import React, { useState, useEffect } from 'react';
import './TrelloInterface.css';
import ProjectPlanningModal from '../components/ProjectPlanningModal';

const Card = ({ card, boardId, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [cardText, setCardText] = useState(card.title || card.name || '');
  const [showOptions, setShowOptions] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Fetch tasks for this card
  useEffect(() => {
    const fetchTasks = async () => {
      if (!card.id || !boardId) return;

      setIsLoadingTasks(true);
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`http://localhost:3000/boards/${boardId}/cards/${card.id}/tasks`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }

        const data = await response.json();
        setTasks(data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchTasks();
  }, [card.id, boardId]);

  const handleSave = () => {
    if (cardText.trim() === '') return;

    onUpdate(boardId, card.id, cardText);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setCardText(card.title || card.name || '');
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    onDelete(boardId, card.id);
    setShowOptions(false);
  };

  const handleCardClick = (e) => {
    // Don't open modal if clicking on menu or editing
    if (isEditing || e.target.classList.contains('card-menu')) return;
    setIsModalOpen(true);
  };

  const handleTaskClick = (task, e) => {
    e.stopPropagation();
    const taskWithCardName = {
      ...task,
      cardName: card.title || card.name
    };
    setSelectedTask(taskWithCardName);
    setIsModalOpen(true);
  };

  return (
    <>
      <div
        className={`card ${tasks.length === 0 && !isLoadingTasks ? 'card-empty' : ''}`}
        style={{ position: 'relative', cursor: 'pointer' }}
        onMouseEnter={() => setShowOptions(true)}
        onMouseLeave={() => setShowOptions(false)}
        onClick={handleCardClick}
      >
        <span className="card-menu" style={{
          position: 'absolute',
          top: '-2px',
          right: '10px',
          fontSize: '24px',
          color: '#fff',
          zIndex: 2,
          cursor: 'pointer'
        }}>
          &#8230;
        </span>
        {isEditing ? (
          <div className="edit-card-form">
            <textarea
              value={cardText}
              onChange={(e) => setCardText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="card-textarea"
              rows="3"
              autoFocus
            />
            <div className="form-actions">
              <button
                onClick={handleSave}
                className="add-card-btn"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setCardText(card.title || card.name || '');
                  setIsEditing(false);
                }}
                className="cancel-btn"
              >
                <span className="cancel-icon">✕</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="card-inner">
            <div className="card-content">
              <h4 className="card-title">{card.title || card.name}</h4>
            </div>

            <div className="card-tasks-container">
              {isLoadingTasks ? (
                <p className="loading-tasks">Loading tasks...</p>
              ) : (
                <>
                  {tasks.length > 0 && (
                    <div className="tasks-list">
                      {tasks.map(task => (
                        <div
                          key={task.id}
                          className="task-item"
                          onClick={(e) => handleTaskClick(task, e)}
                        >
                          <span className="task-title">{task.title || task.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Card footer with Add button and image icon */}
            <div className="card-footer">
              <button className="add-card-link">
                <span className="add-icon">+</span> Add a card
              </button>
              <span className="image-icon">🖼️</span>
            </div>
          </div>
        )}
      </div>
      {selectedTask && isModalOpen && (
        <ProjectPlanningModal
          onClose={() => {
            setIsModalOpen(false);
            setSelectedTask(null);
          }}
          boardId={boardId}
          cardId={card.id}
          task={selectedTask}
        />
      )}
    </>
  );
};

export default Card;
