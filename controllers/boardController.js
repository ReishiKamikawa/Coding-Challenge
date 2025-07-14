const { db } = require('../firebase');
const { collection, doc, getDoc, getDocs, updateDoc, deleteDoc, runTransaction } = require('firebase/firestore');

exports.createBoard = async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required.' });
  }

  try {
    const result = await runTransaction(db, async (transaction) => {
      // Create new board in Firestore within the transaction
      const boardsRef = collection(db, 'boards');
      const newBoardRef = doc(boardsRef);

      transaction.set(newBoardRef, {
        name,
        description,
        createdAt: new Date().toISOString()
      });

      return {
        id: newBoardRef.id,
        name,
        description
      };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating board:', error);
    res.status(500).json({ error: 'Failed to create board' });
  }
};

exports.getBoards = async (req, res) => {
  try {
    const boardsRef = collection(db, 'boards');
    const querySnapshot = await getDocs(boardsRef);

    const boards = [];
    querySnapshot.forEach(doc => {
      boards.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json(boards);
  } catch (error) {
    console.error('Error getting boards:', error);
    res.status(500).json({ error: 'Failed to get boards' });
  }
};

exports.getBoardById = async (req, res) => {
  try {
    const boardRef = doc(db, 'boards', req.params.id);
    const boardDoc = await getDoc(boardRef);

    if (!boardDoc.exists()) {
      return res.status(404).json({ error: 'Board not found.' });
    }

    res.status(200).json({
      id: boardDoc.id,
      ...boardDoc.data()
    });
  } catch (error) {
    console.error('Error getting board:', error);
    res.status(500).json({ error: 'Failed to get board' });
  }
};

exports.updateBoard = async (req, res) => {
  const { name, description } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required.' });
  }

  try {
    const result = await runTransaction(db, async (transaction) => {
      const boardRef = doc(db, 'boards', req.params.id);
      const boardDoc = await transaction.get(boardRef);

      if (!boardDoc.exists()) {
        throw new Error('Board not found');
      }

      transaction.update(boardRef, {
        name,
        description,
        updatedAt: new Date().toISOString()
      });

      return {
        id: boardDoc.id,
        name,
        description
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating board:', error);
    if (error.message === 'Board not found') {
      return res.status(404).json({ error: 'Board not found.' });
    }
    res.status(500).json({ error: 'Failed to update board' });
  }
};

exports.deleteBoard = async (req, res) => {
  try {
    const result = await runTransaction(db, async (transaction) => {
      const boardRef = doc(db, 'boards', req.params.id);
      const boardDoc = await transaction.get(boardRef);

      if (!boardDoc.exists()) {
        throw new Error('Board not found');
      }

      transaction.delete(boardRef);
      return true;
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting board:', error);
    if (error.message === 'Board not found') {
      return res.status(404).json({ error: 'Board not found.' });
    }
    res.status(500).json({ error: 'Failed to delete board' });
  }
};
