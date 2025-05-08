import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth } from './firebase-config';
import { onAuthStateChanged } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';


import './App.css';
import Login from './Login';
import Notes from './Notes';
import ShareNote from './ShareNote';
import ViewNote from './ViewNote';

function App() {
  const [user, setUser] = useState(undefined); // undefined = טעינה ראשונית

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user || null);
    });
    return unsubscribe;
  }, []);

  if (user === undefined) return <div className="p-4">טוען...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/notes" element={user ? <Notes /> : <Login onLogin={() => setUser(auth.currentUser)} />} />
        <Route path="/share" element={user ? <ShareNote /> : <Login onLogin={() => setUser(auth.currentUser)} />} />
        <Route path="/view/:id" element={<ViewNote />} />
        <Route path="/view" element={<ViewNote />} />
        <Route path="/" element={user ? <Navigate to="/notes" /> : <Login onLogin={() => setUser(auth.currentUser)} />} />
      </Routes>
    </Router>
  );
}

export default App;
