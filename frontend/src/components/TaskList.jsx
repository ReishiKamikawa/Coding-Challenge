import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const TaskList = ({ tasks, onDragEnd, listId, listTitle }) => {
  return (
    <div className="task-list-container">
      <h3 className="task-list-title">{listTitle}</h3>
      <Droppable droppableId={listId}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="task-list"
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`task-item ${snapshot.isDragging ? 'dragging' : ''}`}
                  >
                    <div className="task-content">
                      <span className="task-title">{task.title}</span>
                      <div className="task-meta">
                        {task.status && <span className="task-status">{task.status}</span>}
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default TaskList;
