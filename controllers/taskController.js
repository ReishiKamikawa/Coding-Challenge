const { db } = require('../firebase');
const { collection, doc, getDoc, getDocs, updateDoc, deleteDoc, query, where, runTransaction } = require('firebase/firestore');

exports.getTasks = async (req, res) => {
  const cardId = req.params.id;

  try {
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('cardId', '==', cardId));
    const querySnapshot = await getDocs(q);

    const cardTasks = [];
    querySnapshot.forEach(doc => {
      cardTasks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json(cardTasks);
  } catch (error) {
    console.error('Error getting tasks:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
};

exports.createTask = async (req, res) => {
  const cardId = req.params.id;
  const { title, description, status } = req.body;
  const ownerId = req.user?.id || null;

  if (!title || !description || !status) {
    return res.status(400).json({ error: 'Title, description, and status are required.' });
  }

  try {
    const result = await runTransaction(db, async (transaction) => {

      const cardRef = doc(db, 'cards', cardId);
      const cardDoc = await transaction.get(cardRef);

      if (!cardDoc.exists()) {
        throw new Error('Card not found');
      }


      const tasksRef = collection(db, 'tasks');
      const newTaskRef = doc(tasksRef);
      const taskData = {
        id: newTaskRef.id,
        cardId,
        ownerId,
        title,
        description,
        status
      };
      transaction.set(newTaskRef, taskData);

      return taskData;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating task:', error);
    if (error.message === 'Card not found') {
      return res.status(404).json({ error: 'Card not found.' });
    }
    res.status(500).json({ error: 'Failed to create task' });
  }
};

exports.getTaskById = async (req, res) => {
  const cardId = req.params.id;
  const taskId = req.params.taskId;

  try {
    const taskRef = doc(db, 'tasks', taskId);
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists() || taskDoc.data().cardId !== cardId) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.status(200).json({
      id: taskDoc.id,
      ...taskDoc.data()
    });
  } catch (error) {
    console.error('Error getting task:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
};

exports.updateTask = async (req, res) => {
  const cardId = req.params.id;
  const taskId = req.params.taskId;

  try {
    const result = await runTransaction(db, async (transaction) => {
      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await transaction.get(taskRef);

      if (!taskDoc.exists() || taskDoc.data().cardId !== cardId) {
        throw new Error('Task not found');
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date().toISOString()
      };

      transaction.update(taskRef, updateData);

      return { id: taskId, cardId };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Error updating task:', error);
    if (error.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found.' });
    }
    res.status(500).json({ error: 'Failed to update task' });
  }
};

exports.deleteTask = async (req, res) => {
  const cardId = req.params.id;
  const taskId = req.params.taskId;

  try {

    const taskRef = doc(db, 'tasks', taskId);
    const cardRef = doc(db, 'cards', cardId);
    const [taskDoc, cardDoc] = await Promise.all([
      getDoc(taskRef),
      getDoc(cardRef)
    ]);

    if (!taskDoc.exists() || taskDoc.data().cardId !== cardId) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await runTransaction(db, async (transaction) => {

      transaction.delete(taskRef);
      if (cardDoc.exists()) {
        const card = cardDoc.data();
        const tasksCount = Math.max((card.tasks_count || 0) - 1, 0);
        transaction.update(cardRef, { tasks_count: tasksCount });
      }
      return true;
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    if (error.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found.' });
    }
    res.status(500).json({ error: 'Failed to delete task' });
  }
};


exports.assignMember = async (req, res) => {
  const cardId = req.params.id;
  const taskId = req.params.taskId;
  const { memberId } = req.body;

  if (!memberId) {
    return res.status(400).json({ error: 'memberId required.' });
  }

  try {
    const result = await runTransaction(db, async (transaction) => {

      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await transaction.get(taskRef);

      if (!taskDoc.exists() || taskDoc.data().cardId !== cardId) {
        throw new Error('Task not found');
      }


      const assignmentsRef = collection(db, 'taskAssignments');
      const q = query(
        assignmentsRef,
        where('taskId', '==', taskId),
        where('memberId', '==', memberId)
      );
      const querySnapshot = await getDocs(q);


      if (querySnapshot.empty) {
        const newAssignmentRef = doc(assignmentsRef);
        transaction.set(newAssignmentRef, {
          taskId,
          memberId,
          createdAt: new Date().toISOString()
        });
      }

      return { taskId, memberId };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error assigning member:', error);
    if (error.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found.' });
    }
    res.status(500).json({ error: 'Failed to assign member' });
  }
};

exports.getAssignedMembers = async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const assignmentsRef = collection(db, 'taskAssignments');
    const q = query(assignmentsRef, where('taskId', '==', taskId));
    const querySnapshot = await getDocs(q);

    const members = [];
    querySnapshot.forEach(doc => {
      members.push({
        id: doc.id,
        taskId,
        memberId: doc.data().memberId
      });
    });

    res.status(200).json(members);
  } catch (error) {
    console.error('Error getting assigned members:', error);
    res.status(500).json({ error: 'Failed to get assigned members' });
  }
};

exports.removeAssignment = async (req, res) => {
  const taskId = req.params.taskId;
  const memberId = req.params.memberId;

  try {
    await runTransaction(db, async (transaction) => {
      const assignmentsRef = collection(db, 'taskAssignments');
      const q = query(
        assignmentsRef,
        where('taskId', '==', taskId),
        where('memberId', '==', memberId)
      );
      const querySnapshot = await getDocs(q);


      querySnapshot.forEach(doc => {
        transaction.delete(doc.ref);
      });

      return true;
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error removing assignment:', error);
    res.status(500).json({ error: 'Failed to remove assignment' });
  }
};


exports.attachGithub = async (req, res) => {
  const taskId = req.params.taskId;
  const { type, number, sha } = req.body;

  try {
    const result = await runTransaction(db, async (transaction) => {

      const taskRef = doc(db, 'tasks', taskId);
      const taskDoc = await transaction.get(taskRef);

      if (!taskDoc.exists()) {
        throw new Error('Task not found');
      }


      const attachmentsRef = collection(db, 'taskGithubAttachments');
      const newAttachmentRef = doc(attachmentsRef);

      const attachmentData = {
        taskId,
        type,
        number,
        sha,
        createdAt: new Date().toISOString()
      };

      transaction.set(newAttachmentRef, attachmentData);

      return {
        id: newAttachmentRef.id,
        ...attachmentData
      };
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error attaching GitHub item:', error);
    if (error.message === 'Task not found') {
      return res.status(404).json({ error: 'Task not found.' });
    }
    res.status(500).json({ error: 'Failed to attach GitHub item' });
  }
};

exports.getGithubAttachments = async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const attachmentsRef = collection(db, 'taskGithubAttachments');
    const q = query(attachmentsRef, where('taskId', '==', taskId));
    const querySnapshot = await getDocs(q);

    const attachments = [];
    querySnapshot.forEach(doc => {
      attachments.push({
        attachmentId: doc.id,
        ...doc.data()
      });
    });

    res.status(200).json(attachments);
  } catch (error) {
    console.error('Error getting GitHub attachments:', error);
    res.status(500).json({ error: 'Failed to get GitHub attachments' });
  }
};

exports.removeGithubAttachment = async (req, res) => {
  const taskId = req.params.taskId;
  const attachmentId = req.params.attachmentId;

  try {
    await runTransaction(db, async (transaction) => {
      const attachmentRef = doc(db, 'taskGithubAttachments', attachmentId);
      const attachmentDoc = await transaction.get(attachmentRef);

      if (!attachmentDoc.exists() || attachmentDoc.data().taskId !== taskId) {
        throw new Error('Attachment not found');
      }

      transaction.delete(attachmentRef);
      return true;
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error removing GitHub attachment:', error);
    if (error.message === 'Attachment not found') {
      return res.status(404).json({ error: 'Attachment not found.' });
    }
    res.status(500).json({ error: 'Failed to remove GitHub attachment' });
  }
};
