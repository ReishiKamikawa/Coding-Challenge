const { db } = require('../firebase');
const { collection, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, runTransaction } = require('firebase/firestore');

exports.getCards = async (req, res) => {
  const boardId = req.params.boardId;

  try {
    const cardsRef = collection(db, 'cards');
    const q = query(cardsRef, where('boardId', '==', boardId));
    const querySnapshot = await getDocs(q);

    const boardCards = [];
    querySnapshot.forEach(doc => {
      boardCards.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json(boardCards);
  } catch (error) {
    console.error('Error getting cards:', error);
    res.status(500).json({ error: 'Failed to get cards' });
  }
};

exports.createCard = async (req, res) => {
  const boardId = req.params.boardId;
  const { name, description, createdAt } = req.body;

  if (!name || !description) {
    return res.status(400).json({ error: 'Name and description are required.' });
  }

  try {
    
    const result = await runTransaction(db, async (transaction) => {
      
      const boardRef = doc(db, 'boards', boardId);
      const boardDoc = await transaction.get(boardRef);

      if (!boardDoc.exists()) {
        throw new Error('Board not found');
      }

      
      const cardsRef = collection(db, 'cards');
      const newCardRef = doc(cardsRef);

      const cardData = {
        boardId,
        name,
        description,
        createdAt: createdAt || new Date().toISOString(),
        members: [],
        tasks_count: 0,
        owner_id: req.user?.id || null
      };

      transaction.set(newCardRef, cardData);

      return {
        id: newCardRef.id,
        ...cardData
      };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating card:', error);
    if (error.message === 'Board not found') {
      return res.status(404).json({ error: 'Board not found.' });
    }
    res.status(500).json({ error: 'Failed to create card' });
  }
};

exports.getCardById = async (req, res) => {
  const boardId = req.params.boardId;
  const cardId = req.params.id;

  try {
    const cardRef = doc(db, 'cards', cardId);
    const cardDoc = await getDoc(cardRef);

    if (!cardDoc.exists() || cardDoc.data().boardId !== boardId) {
      return res.status(404).json({ error: 'Card not found.' });
    }

    res.status(200).json({
      id: cardDoc.id,
      ...cardDoc.data()
    });
  } catch (error) {
    console.error('Error getting card:', error);
    res.status(500).json({ error: 'Failed to get card' });
  }
};

exports.getCardsByUser = async (req, res) => {
  const boardId = req.params.boardId;
  const userId = req.params.user_id;

  try {
    const cardsRef = collection(db, 'cards');
    const q = query(cardsRef, where('boardId', '==', boardId));
    const querySnapshot = await getDocs(q);

    const userCards = [];
    querySnapshot.forEach(doc => {
      const card = doc.data();
      if (card.members.includes(userId) || card.owner_id === userId) {
        userCards.push({
          id: doc.id,
          name: card.name,
          description: card.description,
          tasks_count: card.tasks_count,
          list_member: card.members,
          createdAt: card.createdAt
        });
      }
    });

    res.status(200).json(userCards);
  } catch (error) {
    console.error('Error getting cards by user:', error);
    res.status(500).json({ error: 'Failed to get cards by user' });
  }
};

exports.updateCard = async (req, res) => {
  const boardId = req.params.boardId;
  const cardId = req.params.id;
  const { name, description, params } = req.body;

  try {
    const result = await runTransaction(db, async (transaction) => {
      const cardRef = doc(db, 'cards', cardId);
      const cardDoc = await transaction.get(cardRef);

      if (!cardDoc.exists() || cardDoc.data().boardId !== boardId) {
        throw new Error('Card not found');
      }

      const updateData = {};
      if (name) updateData.name = name;
      if (description) updateData.description = description;
      if (params) Object.assign(updateData, params);
      updateData.updatedAt = new Date().toISOString();

      transaction.update(cardRef, updateData);

      return {
        id: cardDoc.id,
        ...cardDoc.data(),
        ...updateData
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating card:', error);
    if (error.message === 'Card not found') {
      return res.status(404).json({ error: 'Card not found.' });
    }
    res.status(500).json({ error: 'Failed to update card' });
  }
};

exports.deleteCard = async (req, res) => {
  const boardId = req.params.boardId;
  const cardId = req.params.id;

  try {
    await runTransaction(db, async (transaction) => {
      const cardRef = doc(db, 'cards', cardId);
      const cardDoc = await transaction.get(cardRef);

      if (!cardDoc.exists() || cardDoc.data().boardId !== boardId) {
        throw new Error('Card not found');
      }

      
      transaction.delete(cardRef);

      
      return true;
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting card:', error);
    if (error.message === 'Card not found') {
      return res.status(404).json({ error: 'Card not found.' });
    }
    res.status(500).json({ error: 'Failed to delete card' });
  }
};


exports.inviteMember = async (req, res) => {
  const boardId = req.params.boardId;
  const { invite_id, board_owner_id, member_id, email_member, status } = req.body;

  if (!invite_id || !board_owner_id || !member_id || !status) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    await runTransaction(db, async (transaction) => {
      
      const boardRef = doc(db, 'boards', boardId);
      const boardDoc = await transaction.get(boardRef);

      if (!boardDoc.exists()) {
        throw new Error('Board not found');
      }

      
      const invitationsRef = collection(db, 'invitations');
      const newInvitationRef = doc(invitationsRef);

      transaction.set(newInvitationRef, {
        boardId,
        invite_id,
        board_owner_id,
        member_id,
        email_member,
        status,
        createdAt: new Date().toISOString()
      });

      return true;
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error creating invitation:', error);
    if (error.message === 'Board not found') {
      return res.status(404).json({ error: 'Board not found.' });
    }
    res.status(500).json({ error: 'Failed to create invitation' });
  }
};

exports.acceptInvite = async (req, res) => {
  const boardId = req.params.boardId;
  const { invite_id, card_id, member_id, status } = req.body;

  if (!invite_id || !card_id || !member_id || !status) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    await runTransaction(db, async (transaction) => {
      
      const invitationsRef = collection(db, 'invitations');
      const q = query(
        invitationsRef,
        where('boardId', '==', boardId),
        where('invite_id', '==', invite_id),
        where('member_id', '==', member_id)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Invitation not found');
      }

      
      const inviteDoc = querySnapshot.docs[0];
      transaction.update(doc(db, 'invitations', inviteDoc.id), { status });

      
      if (status === 'accepted') {
        const cardRef = doc(db, 'cards', card_id);
        const cardDoc = await transaction.get(cardRef);

        if (!cardDoc.exists()) {
          throw new Error('Card not found');
        }

        const cardData = cardDoc.data();
        const members = cardData.members || [];

        if (!members.includes(member_id)) {
          members.push(member_id);
          transaction.update(cardRef, { members });
        }
      }

      return true;
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    if (error.message === 'Invitation not found') {
      return res.status(404).json({ error: 'Invitation not found.' });
    }
    if (error.message === 'Card not found') {
      return res.status(404).json({ error: 'Card not found.' });
    }
    res.status(500).json({ error: 'Failed to accept invitation' });
  }
};
