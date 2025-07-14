import React, { useState, useEffect } from 'react';
import './TrelloInterface.css';
import Card from './Card';
import InviteToBoardModal from '../components/InviteToBoardModal';

const TrelloInterface = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showAddBoardModal, setShowAddBoardModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newCardName, setNewCardName] = useState('');
  const [newCardDescription, setNewCardDescription] = useState('');
  const [cardNameError, setCardNameError] = useState('');
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [boardNameError, setBoardNameError] = useState('');
  const [selectedColor, setSelectedColor] = useState('#8b5cf6'); // Default purple color
  const [newCardText, setNewCardText] = useState({});
  const [showAddCard, setShowAddCard] = useState({});
  const [currentBoard, setCurrentBoard] = useState(null);
  const [lists, setLists] = useState([
    { id: 'todo', title: 'To do', cards: [] },
    { id: 'doing', title: 'Doing', cards: [] },
    { id: 'done', title: 'Done', cards: [] }
  ]);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Fetch boards from the backend API
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:3000/boards', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch boards');
        }

        const data = await response.json();
        setBoards(data);

        // Select the first board by default if there are boards
        if (data.length > 0) {
          setCurrentBoard(data[0]);
          fetchCards(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching boards:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, []);

  // Fetch cards for a specific board
  const fetchCards = async (boardId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`http://localhost:3000/boards/${boardId}/cards`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch cards');
      }

      const cardsData = await response.json();

      // Set lists as a single list containing all cards
      setLists([
        { id: 'all', title: 'All Cards', cards: cardsData }
      ]);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Change selected board
  const handleBoardSelect = (board) => {
    setCurrentBoard(board);
    fetchCards(board.id);
  };

  // Handle right click on a board to show cards directly
  const handleBoardRightClick = (e, board) => {
    e.preventDefault();
    setCurrentBoard(board);
    fetchCards(board.id);
    // Show a highlight or some visual indication that this board's cards are displayed
  };

  // Add a new card to a list
  const addCard = async (listId, text) => {
    if (!text.trim() || !currentBoard) return;

    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`http://localhost:3000/boards/${currentBoard.id}/cards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: text.trim(),
          description: '',
          status: listId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create card');
      }

      const newCard = await response.json();

      // Update the lists state with the new card
      setLists(lists.map(list =>
        list.id === listId
          ? { ...list, cards: [...list.cards, newCard] }
          : list
      ));

      setNewCardText({ ...newCardText, [listId]: '' });
      setShowAddCard({ ...showAddCard, [listId]: false });
    } catch (err) {
      console.error('Error creating card:', err);
      setError(err.message);
    }
  };

  // Update a card
  const updateCard = async (listId, cardId, newText) => {
    try {
      const token = localStorage.getItem('auth_token');

      // Find the card in the lists
      let cardToUpdate = null;
      lists.forEach(list => {
        const foundCard = list.cards.find(card => card.id === cardId);
        if (foundCard) {
          cardToUpdate = foundCard;
        }
      });

      if (!cardToUpdate) return;

      const response = await fetch(`http://localhost:3000/boards/${currentBoard.id}/cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...cardToUpdate,
          title: newText
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update card');
      }

      const updatedCard = await response.json();

      // Update the lists state with the updated card
      setLists(lists.map(list => ({
        ...list,
        cards: list.cards.map(card =>
          card.id === cardId ? updatedCard : card
        )
      })));
    } catch (err) {
      console.error('Error updating card:', err);
      setError(err.message);
    }
  };

  // Delete a card
  const deleteCard = async (listId, cardId) => {
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`http://localhost:3000/boards/${currentBoard.id}/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete card');
      }

      // Update the lists state by removing the deleted card
      setLists(lists.map(list => ({
        ...list,
        cards: list.cards.filter(card => card.id !== cardId)
      })));
    } catch (err) {
      console.error('Error deleting card:', err);
      setError(err.message);
    }
  };

  // Create a new board
  const createBoard = async (name, description) => {
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch('http://localhost:3000/boards', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create board');
      }

      const newBoard = await response.json();

      // Add the new board to the boards state
      setBoards([...boards, newBoard]);

      // Select the new board
      setCurrentBoard(newBoard);

      // Initialize empty lists for the new board
      setLists([
        { id: 'todo', title: 'To do', cards: [] },
        { id: 'doing', title: 'Doing', cards: [] },
        { id: 'done', title: 'Done', cards: [] }
      ]);
    } catch (err) {
      console.error('Error creating board:', err);
      setError(err.message);
    }
  };

  const handleAddCardClick = (listId) => {
    setShowAddCard({ ...showAddCard, [listId]: true });
  };

  const handleCancelAddCard = (listId) => {
    setShowAddCard({ ...showAddCard, [listId]: false });
    setNewCardText({ ...newCardText, [listId]: '' });
  };

  // Handle opening the add board modal
  const handleOpenAddBoardModal = () => {
    // Reset form fields when opening modal
    setNewBoardName('');
    setNewBoardDescription('');
    setBoardNameError('');
    setSelectedColor('#8b5cf6'); // Reset to default color
    setShowAddBoardModal(true);
  };

  // Handle closing the add board modal
  const handleCloseAddBoardModal = () => {
    setShowAddBoardModal(false);
    // Reset form state
    setNewBoardName('');
    setNewBoardDescription('');
    setBoardNameError('');
  };

  // Handle board creation with validation
  const handleCreateBoard = () => {
    // Validate board name
    if (!newBoardName.trim()) {
      setBoardNameError('Board name is required');
      return;
    }

    // Create the board
    createBoard(newBoardName.trim(), newBoardDescription.trim());

    // Close the modal
    handleCloseAddBoardModal();
  };

  // Handle opening the add card modal
  const handleOpenAddCardModal = () => {
    if (!currentBoard) {
      setError('Please select a board first');
      return;
    }
    // Reset form fields when opening modal
    setNewCardName('');
    setNewCardDescription('');
    setCardNameError('');
    setShowAddCardModal(true);
  };

  // Handle closing the add card modal
  const handleCloseAddCardModal = () => {
    setShowAddCardModal(false);
    // Reset form state
    setNewCardName('');
    setNewCardDescription('');
    setCardNameError('');
  };

  // Create a new card via modal
  const handleCreateCard = () => {
    // Validate card name
    if (!newCardName.trim()) {
      setCardNameError('Card name is required');
      return;
    }

    // Create the card
    createCardViaModal(newCardName.trim(), newCardDescription.trim());

    // Close the modal
    handleCloseAddCardModal();
  };

  // API call to create a card from the modal
  const createCardViaModal = async (name, description) => {
    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`http://localhost:3000/boards/${currentBoard.id}/cards`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name,
          description: description,
          status: 'todo' // Default to todo status for new cards
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create card');
      }

      const newCard = await response.json();

      // Refresh the cards for the current board to include the new card
      fetchCards(currentBoard.id);

    } catch (err) {
      console.error('Error creating card:', err);
      setError(err.message);
    }
  };

  // Colors for board selection
  const boardColors = [
    '#8b5cf6', // Purple
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#ef4444', // Red
    '#6b7280', // Gray
  ];

  // Get user data from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const userInitials = userData.email ? userData.email.substring(0, 2).toUpperCase() : 'U';

  if (loading && !currentBoard) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading boards and cards...</p>
      </div>
    );
  }

  return (
    <div className="trello-container">
      {/* Header */}
      <div className="header">
        <div className="header-left">
          <div className="logo">S</div>
        </div>
        <div className="header-right">
          <div className="settings-icon">⚙️</div>
          <div className="user-avatar">{userInitials}</div>
        </div>
      </div>

      <div className="main-content">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="sidebar-section">
            <div className="section-header">
              <h3>Your boards</h3>
              <div className="more-icon" onClick={handleOpenAddBoardModal}>⋯</div>
            </div>
            {boards.map(board => (
              <div
                key={board.id}
                className={`board-item ${currentBoard && board.id === currentBoard.id ? 'active' : ''}`}
                onClick={() => handleBoardSelect(board)}
                onContextMenu={(e) => handleBoardRightClick(e, board)}
              >
                <div className="board-color" style={{ backgroundColor: board.color || selectedColor }}></div>
                <span>{board.name}</span>
                <div className="board-actions">
                  <button
                    className="add-card-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentBoard(board);
                      handleOpenAddCardModal();
                    }}
                    title="Add card to this board"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {currentBoard && (
            <div className="sidebar-section">
              <div className="section-header">
                <h3>👥 Members</h3>
              </div>
              <div className="members-list">
                <div className="member-item">
                  <div className="member-avatar">{userInitials}</div>
                  <span>{userData.email || 'You'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="sidebar-bottom">
            <div className="close-warning">
              <p>You can't find and reopen closed boards if I close the board</p>
              <button
                onClick={() => setShowCloseModal(true)}
                className="close-button"
              >
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Board Content */}
        <div className="board-content">
          {error && (
            <div className="error-message">{error}</div>
          )}

          {currentBoard ? (
            <>
              {/* Board Header */}
              <div className="board-header">
                <h1>{currentBoard.name}</h1>
                <button
                  className="invite-button"
                  onClick={() => setShowInviteModal(true)}
                >
                  <div className="invite-icon">👥</div>
                  <span>Invite member</span>
                </button>
              </div>

              {/* Board Cards - flat list, not grouped by status */}
              <div className="cards-container">
                {lists.flatMap(list => list.cards).length > 0 ? (
                  <>
                    {lists.flatMap(list => list.cards).map(card => (
                      <Card
                        key={card.id}
                        card={card}
                        boardId={currentBoard.id}
                        onUpdate={updateCard}
                        onDelete={deleteCard}
                      />
                    ))}
                    <div className="add-list-card">
                      <button className="add-list-button">
                        <span className="plus-icon">+</span>
                        Add another list
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="add-list-card">
                      <button className="add-list-button">
                        <span className="plus-icon">+</span>
                        Add another list
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>No boards found</h2>
              <p>Create a new board to get started or select one from the sidebar</p>
              <button
                className="create-board-btn"
                onClick={handleOpenAddBoardModal}
              >
                Create Board
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Close Board Modal */}
      {showCloseModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target.className === 'modal-overlay') {
            setShowCloseModal(false);
          }
        }}>
          <div className="modal">
            <h2>Close Board</h2>
            <p>Are you sure you want to close this board? You won't be able to find and reopen it later.</p>
            <div className="modal-actions">
              <button
                onClick={() => setShowCloseModal(false)}
                className="cancel-modal-btn"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Delete the board on backend
                  if (currentBoard) {
                    const token = localStorage.getItem('auth_token');
                    fetch(`http://localhost:3000/boards/${currentBoard.id}`, {
                      method: 'DELETE',
                      headers: {
                        'Authorization': `Bearer ${token}`
                      }
                    }).then(response => {
                      if (response.ok) {
                        // Remove board from state
                        const updatedBoards = boards.filter(b => b.id !== currentBoard.id);
                        setBoards(updatedBoards);

                        // Select another board or set to null if none left
                        if (updatedBoards.length > 0) {
                          setCurrentBoard(updatedBoards[0]);
                          fetchCards(updatedBoards[0].id);
                        } else {
                          setCurrentBoard(null);
                          setLists([
                            { id: 'todo', title: 'To do', cards: [] },
                            { id: 'doing', title: 'Doing', cards: [] },
                            { id: 'done', title: 'Done', cards: [] }
                          ]);
                        }
                      }
                    }).catch(err => {
                      console.error('Error closing board:', err);
                      setError('Failed to close board');
                    });
                  }

                  setShowCloseModal(false);
                }}
                className="confirm-modal-btn"
              >
                Close Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Board Modal */}
      {showAddBoardModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target.className === 'modal-overlay') {
            handleCloseAddBoardModal();
          }
        }}>
          <div className="modal add-board-modal">
            <h2>Create New Board</h2>
            <div className="modal-content">
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="Board name"
                className="board-name-input"
              />
              <textarea
                value={newBoardDescription}
                onChange={(e) => setNewBoardDescription(e.target.value)}
                placeholder="Board description"
                className="board-description-textarea"
                rows="3"
              />
              <div className="color-selection">
                <h4>Select a color</h4>
                <div className="color-options">
                  {boardColors.map(color => (
                    <div
                      key={color}
                      className={`color-option ${selectedColor === color ? 'selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setSelectedColor(color)}
                    ></div>
                  ))}
                </div>
              </div>
              {boardNameError && (
                <div className="error-message">{boardNameError}</div>
              )}
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowAddBoardModal(false)}
                className="cancel-modal-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBoard}
                className="confirm-modal-btn"
              >
                Create Board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Card Modal (for individual card addition) */}
      {showAddCardModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target.className === 'modal-overlay') {
            handleCloseAddCardModal();
          }
        }}>
          <div className="modal add-card-modal">
            <h2>Add New Card</h2>
            <div className="modal-content">
              <input
                type="text"
                value={newCardName}
                onChange={(e) => setNewCardName(e.target.value)}
                placeholder="Card title"
                className="card-name-input"
              />
              <textarea
                value={newCardDescription}
                onChange={(e) => setNewCardDescription(e.target.value)}
                placeholder="Card description"
                className="card-description-textarea"
                rows="3"
              />
              {cardNameError && (
                <div className="error-message">{cardNameError}</div>
              )}
            </div>
            <div className="modal-actions">
              <button
                onClick={() => setShowAddCardModal(false)}
                className="cancel-modal-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCard}
                className="confirm-modal-btn create-btn"
              >
                Add Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <InviteToBoardModal
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  );
};

export default TrelloInterface;
