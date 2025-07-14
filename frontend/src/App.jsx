import React, { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import VerifyPage from './pages/VerifyPage'
import TrelloInterface from './pages/TrelloInterface'
import TrelloWorkspace from './pages/TrelloWorkspace'

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [userEmail, setUserEmail] = useState('');


  useEffect(() => {
    const path = window.location.pathname;

    if (path === '/trello') {

      const token = localStorage.getItem('auth_token');
      if (token) {
        setCurrentPage('trello');
      } else {

        window.location.href = '/';
      }
    } else if (path === '/verify') {
      setCurrentPage('verify');
    } else if (path === '/workspace') {
      setCurrentPage('workspace');
    } else {

      setCurrentPage('login');

      if (path !== '/') {
        window.history.pushState(null, '', '/');
      }
    }


    const handleLocationChange = () => {
      const newPath = window.location.pathname;

      if (newPath === '/trello') {
        setCurrentPage('trello');
      } else if (newPath === '/verify') {
        setCurrentPage('verify');
      } else if (newPath === '/workspace') {
        setCurrentPage('workspace');
      } else {
        setCurrentPage('login');
      }
    };

    window.addEventListener('popstate', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);


  const navigateToVerify = (email) => {
    setUserEmail(email);
    setCurrentPage('verify');
    window.history.pushState(null, '', '/verify');
  };

  return (
    <>
      {currentPage === 'login' && <LoginPage onContinue={navigateToVerify} />}
      {currentPage === 'verify' && <VerifyPage email={userEmail} />}
      {currentPage === 'trello' && <TrelloInterface />}
      {currentPage === 'workspace' && <TrelloWorkspace />}
    </>
  )
}

export default App
