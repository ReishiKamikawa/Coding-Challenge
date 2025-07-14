import React, { useEffect, useState } from 'react';
import './TrelloWorkspace.css';

const TrelloWorkspace = () => {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('http://localhost:3000/boards', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch boards');
        const data = await response.json();
        setBoards(Array.isArray(data) ? data : data.boards || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBoards();
  }, []);

  return (
    <div className="workspace-container">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo">
            <span>S</span>
          </div>
        </div>
        <div className="header-right">
          <button className="info-button">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div className="user-avatar">
            <span>SD</span>
          </div>
        </div>
      </header>

      <div className="main-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-menu">
            <div className="menu-item active">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="rNound" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Boards</span>
            </div>
            <div className="menu-item">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <span>All Members</span>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="workspace-section">
            <h1 className="workspace-title">YOUR WORKSPACES</h1>

            <div className="boards-grid">
              {loading && <div>Loading boards...</div>}
              {error && <div style={{ color: 'red' }}>{error}</div>}
              {[...boards, { isCreate: true }].map((board, idx) => (
                board.isCreate ? (
                  <div className="create-board-card" key="create-board">
                    <div className="create-board-content">
                      <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Create a new board</span>
                    </div>
                  </div>
                ) : (
                  <div className="board-card" key={board._id || board.id} onClick={() => window.location.href = `/trello?boardId=${board.id}` }>
                    <span>{board.name}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TrelloWorkspace;
