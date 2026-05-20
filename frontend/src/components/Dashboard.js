import React, { useState, useEffect, useRef, useCallback } from 'react';
import { triggerExplosion } from '../utils/particleEffect';

function Dashboard({ user, token, onLogout, backendUrl, theme, toggleTheme }) {
  const [lists, setLists] = useState([]);
  const [activeList, setActiveList] = useState(1); // Default to list_number 1 ("tasks")
  const [tasks, setTasks] = useState({ task_number: [], task_name: [], time: [], completed: [] });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [revealTasks, setRevealTasks] = useState(false);

  // New List Modal State
  const [showListModal, setShowListModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [listError, setListError] = useState('');

  // New Task Form State
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDeadline, setNewTaskDeadline] = useState('');
  const [taskError, setTaskError] = useState('');

  // Custom Context Menu State
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: '', // 'list' | 'task'
    targetId: null // list_number or task_number
  });

  const contextMenuRef = useRef(null);

  const fetchLists = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/tasks/lists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setLists(data);
      }
    } catch (err) {
      console.error('Error fetching lists:', err);
    }
  }, [backendUrl, token]);

  const fetchTasks = useCallback(async (listNumber) => {
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/tasks/${listNumber}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, token]);

  // Fetch all lists on mount
  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  // Fetch tasks when activeList changes
  useEffect(() => {
    fetchTasks(activeList);
  }, [activeList, fetchTasks]);

  // Handle task cascades entry animation when tasks data changes
  useEffect(() => {
    setRevealTasks(false);
    const timer = setTimeout(() => setRevealTasks(true), 50);
    return () => clearTimeout(timer);
  }, [tasks]);

  // Close context menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (contextMenu.visible && contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        closeContextMenu();
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [contextMenu]);

  // Greeting logic
  const getGreeting = (username) => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) {
      return `Good morning, ${username}`;
    } else if (hour >= 12 && hour < 16) {
      return `Good afternoon, ${username}`;
    } else if (hour >= 16 && hour < 20) {
      return `Good evening, ${username}`;
    } else {
      return `Hello, ${username}`;
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    setListError('');

    if (!newListName.trim()) {
      setListError('List name is required');
      return;
    }

    if (lists.length >= 100) {
      setListError('Maximum limit of 100 lists reached');
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/tasks/lists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ list_name: newListName })
      });
      const data = await res.json();
      if (res.ok) {
        setLists([...lists, data]);
        setActiveList(data.list_number);
        setNewListName('');
        setShowListModal(false);
      } else {
        setListError(data.message || 'Failed to create list');
      }
    } catch (err) {
      setListError('Server error creating list');
    }
  };

  const handleDeleteList = async (listNumber) => {
    if (listNumber === 1) {
      alert('Cannot delete the default tasks list');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this list and all its tasks?')) {
      return;
    }

    try {
      const res = await fetch(`${backendUrl}/api/tasks/lists/${listNumber}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLists(lists.filter(l => l.list_number !== listNumber));
        if (activeList === listNumber) {
          setActiveList(1); // Reset to default
        }
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete list');
      }
    } catch (err) {
      alert('Error deleting list');
    }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    setTaskError('');

    if (!newTaskName.trim()) {
      setTaskError('Task name is required');
      return;
    }

    let deadlineTimestamp = 0;
    if (newTaskDeadline) {
      deadlineTimestamp = new Date(newTaskDeadline).getTime();
    }

    try {
      const res = await fetch(`${backendUrl}/api/tasks/${activeList}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          task_name: newTaskName,
          time: deadlineTimestamp
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(data);
        setNewTaskName('');
        setNewTaskDeadline('');
        setShowTaskForm(false);
      } else {
        setTaskError(data.message || 'Failed to add task');
      }
    } catch (err) {
      setTaskError('Error adding task');
    }
  };

  const handleToggleTask = async (taskNumber, e, currentCompletedStatus) => {
    // If completing the task, trigger particle explosion at mouse coords
    if (currentCompletedStatus === 0 && e) {
      triggerExplosion(e.clientX, e.clientY);
    }

    try {
      const res = await fetch(`${backendUrl}/api/tasks/${activeList}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ task_number: taskNumber })
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(data);
      }
    } catch (err) {
      console.error('Error toggling task:', err);
    }
  };

  const handleDeleteTask = async (taskNumber) => {
    try {
      const res = await fetch(`${backendUrl}/api/tasks/${activeList}/${taskNumber}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(data);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Context Menu Helpers
  const handleListContextMenu = (e, listNumber) => {
    e.preventDefault();
    if (listNumber === 1) return;
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'list',
      targetId: listNumber
    });
  };

  const handleTaskContextMenu = (e, taskNumber) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'task',
      targetId: taskNumber
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, type: '', targetId: null });
  };

  const formatDeadline = (timestamp) => {
    if (!timestamp || timestamp === 0) return null;
    const date = new Date(timestamp);
    return date.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const isOverdue = (timestamp, completedStatus) => {
    if (!timestamp || timestamp === 0 || completedStatus === 1) return false;
    return timestamp < Date.now();
  };

  const formatUserId = (id) => {
    return String(id).padStart(4, '0');
  };

  const activeListName = lists.find(l => l.list_number === activeList)?.list_name || 'Tasks';

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <div className={`sidebar ${isSidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">TaskSpaces</span>
        </div>

        <div className="list-section">
          <div className="list-section-header">
            <span>My Lists</span>
            <button className="add-list-btn" title="Create new list" onClick={() => setShowListModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>

          {lists.map((l) => (
            <div
              key={l.list_number}
              className={`list-item ${activeList === l.list_number ? 'active' : ''}`}
              onClick={() => setActiveList(l.list_number)}
              onContextMenu={(e) => handleListContextMenu(e, l.list_number)}
              title="Right click to delete list"
            >
              <span className="list-item-name">{l.list_name}</span>
              <span className="list-item-badge">#{l.list_number}</span>
            </div>
          ))}
        </div>

        <div className="sidebar-footer">
          <div className="user-profile-info">
            <span className="profile-username" title={user.user_name}>{user.user_name}</span>
            <span className="profile-id">ID: {formatUserId(user.user_id)}</span>
          </div>
          <button className="logout-btn" onClick={onLogout} title="Log Out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>

      {/* Main Panel */}
      <div className="main-panel">
        <header className="main-header">
          <div className="header-left">
            <button className="sandwich-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)} title="Toggle Sidebar">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h2 className="greeting-text">{getGreeting(user.user_name)}</h2>
          </div>

          <div className="header-right">
            <button className="btn-theme-toggle" onClick={toggleTheme} title="Toggle Light/Dark Theme">
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
          </div>
        </header>

        <main className="content-area">
          <div className="todo-card">
            <div className="todo-card-header">
              <h3 className="todo-card-title">{activeListName}</h3>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {tasks.task_name ? tasks.task_name.length : 0} tasks
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Loading tasks...
              </div>
            ) : (
              <>
                <div className="task-list">
                  {tasks.task_name && tasks.task_name.length > 0 ? (
                    tasks.task_name.map((name, index) => {
                      const tNumber = tasks.task_number[index];
                      const tCompleted = tasks.completed[index];
                      const tTime = tasks.time[index];
                      
                      return (
                        <div
                          key={tNumber}
                          className={`task-item scroll-reveal ${revealTasks ? 'reveal-visible' : ''} ${tCompleted === 1 ? 'completed-task' : ''}`}
                          style={{ transitionDelay: `${index * 55}ms` }}
                          onContextMenu={(e) => handleTaskContextMenu(e, tNumber)}
                          title="Right click to delete task"
                        >
                          <div className="task-left">
                            <span className="task-serial">{tNumber}</span>
                            <div className="task-details">
                              <span className="task-name-text">{name}</span>
                              {tTime > 0 && (
                                <span className={`task-deadline ${isOverdue(tTime, tCompleted) ? 'deadline-overdue' : ''}`}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <polyline points="12 6 12 12 16 14"></polyline>
                                  </svg>
                                  {isOverdue(tTime, tCompleted) ? 'Overdue: ' : 'Deadline: '}
                                  {formatDeadline(tTime)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="task-right">
                            <button
                              className={`tick-box ${tCompleted === 1 ? 'checked' : ''}`}
                              onClick={(e) => handleToggleTask(tNumber, e, tCompleted)}
                              title={tCompleted === 1 ? 'Mark pending' : 'Mark completed'}
                            >
                              <svg className="tick-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <polyline points="20 6 9 17 4 12"></polyline>
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-state">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      <p className="empty-state-text">No tasks in this list. Create one below!</p>
                    </div>
                  )}
                </div>

                {/* Add Task Form / Trigger */}
                {showTaskForm ? (
                  <form onSubmit={handleAddTask} className="task-form">
                    {taskError && <div className="alert-error" style={{ marginBottom: '0.5rem' }}>{taskError}</div>}
                    <div className="task-form-inputs">
                      <input
                        type="text"
                        className="form-input"
                        placeholder="What needs to be done?"
                        value={newTaskName}
                        onChange={(e) => setNewTaskName(e.target.value)}
                        required
                      />
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={newTaskDeadline}
                        onChange={(e) => setNewTaskDeadline(e.target.value)}
                        title="Set deadline date & time"
                      />
                    </div>
                    <div className="task-form-actions">
                      <button type="button" className="btn-secondary" onClick={() => { setShowTaskForm(false); setTaskError(''); }}>
                        Cancel
                      </button>
                      <button type="submit" className="btn-action">
                        Create Task
                      </button>
                    </div>
                  </form>
                ) : (
                  <button className="add-task-trigger" onClick={() => setShowTaskForm(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add a Task
                  </button>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Floating Context Menu */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
        >
          {contextMenu.type === 'list' ? (
            <div
              className="context-menu-item"
              onClick={() => {
                handleDeleteList(contextMenu.targetId);
                closeContextMenu();
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete List
            </div>
          ) : (
            <div
              className="context-menu-item"
              onClick={() => {
                handleDeleteTask(contextMenu.targetId);
                closeContextMenu();
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete Task
            </div>
          )}
        </div>
      )}

      {/* Create List Modal overlay */}
      {showListModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="modal-title">Create New List</h3>
            {listError && <div className="alert-error" style={{ marginBottom: '1rem' }}>{listError}</div>}
            <form onSubmit={handleCreateList}>
              <div className="form-group" style={{ marginBottom: '0' }}>
                <label className="form-label">List Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Work, Shopping, Goals"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  required
                  maxLength="20"
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowListModal(false); setNewListName(''); setListError(''); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-action">
                  Create List
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
