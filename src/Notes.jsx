// Notes.jsx - ניהול הפתקים האישיים
import React, { useState, useEffect } from 'react';
import { db } from './firebase-config';
import CryptoJS from 'crypto-js';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [expiry, setExpiry] = useState('');
  const [expiryUnit, setExpiryUnit] = useState('seconds');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [forever, setForever] = useState(true);

  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'notes'), where('uid', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      snapshot.docs.forEach(async (docSnap) => {
        const data = docSnap.data();
        if (data.expirySec && data.createdAt + data.expirySec * 1000 < now) {
          try {
            await deleteDoc(docSnap.ref);
          } catch (err) {
            console.error('שגיאה במחיקת פתק שפג תוקפו:', err);
          }
        }
      });

      const notesData = snapshot.docs
        .filter(docSnap => {
          const d = docSnap.data();
          return !d.expirySec || d.createdAt + d.expirySec * 1000 > now;
        })
        .map(docSnap => {
          const data = docSnap.data();
          let decrypted = '';
          try {
            const bytes = CryptoJS.AES.decrypt(data.text, data.key);
            decrypted = bytes.toString(CryptoJS.enc.Utf8);
          } catch (e) {
            decrypted = '[שגיאה בפענוח]';
          }
          return { id: docSnap.id, ...data, text: decrypted };
        });

      setNotes(notesData);
    });
    return () => unsubscribe();
  }, [user, tick]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    const genKey = CryptoJS.lib.WordArray.random(16).toString();
    const encrypted = CryptoJS.AES.encrypt(newNote, genKey).toString();

    const data = {
      text: encrypted,
      key: genKey,
      uid: user.uid,
      createdAt: Date.now(),
    };
    if (!forever) {
      const val = parseInt(expiry);
      const unit = expiryUnit;
      let seconds = val;
      if (unit === 'minutes') seconds = val * 60;
      else if (unit === 'hours') seconds = val * 3600;
      else if (unit === 'days') seconds = val * 86400;
      else if (unit === 'weeks') seconds = val * 604800;
      data.expirySec = seconds;
    }

    try {
      await addDoc(collection(db, 'notes'), data);
      setNewNote('');
      setExpiry('');
      setForever(true);
    } catch (err) {
      console.error('שגיאה בהוספת פתק:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (err) {
      console.error('שגיאה במחיקת פתק:', err);
    }
  };

  const handleUpdate = async (id) => {
    try {
      const newKey = CryptoJS.lib.WordArray.random(16).toString();
      const newEncrypted = CryptoJS.AES.encrypt(editText, newKey).toString();
      await updateDoc(doc(db, 'notes', id), { text: newEncrypted, key: newKey });
      setEditingId(null);
    } catch (err) {
      console.error('שגיאה בעדכון פתק:', err);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <nav className="flex items-center justify-between mb-6 border-b pb-3">
        <ul className="flex gap-6 text-blue-600">
          <li><a href="/notes" className="underline">הפתקים שלי</a></li>
          <li><a href="/share" className="hover:underline">פתק לחבר</a></li>
          <li><a href="/view" className="hover:underline">פתק מחבר</a></li>
        </ul>
        <button
          onClick={() => {
            signOut(auth).then(() => {
              window.location.href = '/';
            });
          }}
          className="bg-red-500 text-white px-4 py-1.5 rounded hover:bg-red-600"
        >
          התנתקות
        </button>
      </nav>

      <h2 className="text-xl font-bold mb-4">הפתקים שלי 🗒</h2>
      <textarea
        rows="4"
        placeholder="כתוב פתק חדש..."
        className="border p-2 w-full rounded mb-2"
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
      ></textarea>
      {!forever && (
        <div className="flex gap-2 mb-2">
        <input
          type="number"
          placeholder="משך זמן"
          className="border p-2 w-full rounded"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
        />
        <select
          value={expiryUnit}
          onChange={(e) => setExpiryUnit(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="seconds">שניות</option>
          <option value="minutes">דקות</option>
          <option value="hours">שעות</option>
          <option value="days">ימים</option>
          <option value="weeks">שבועות</option>
        </select>
      </div>
      )}
      <label className="flex items-center mb-4">
        <input type="checkbox" checked={forever} onChange={() => setForever(!forever)} className="mr-2" />
        שמור לתמיד
      </label>
      <button
        onClick={handleAddNote}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        הוסף פתק
      </button>

      <div className="mt-6 space-y-4">
        {notes.map(note => (
          <div key={note.id} className="border rounded p-3 bg-gray-50">
            {editingId === note.id ? (
              <>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="border p-2 w-full rounded mb-2"
                ></textarea>
                <button onClick={() => handleUpdate(note.id)} className="bg-green-600 text-white px-3 py-1 rounded">עדכן</button>
              </>
            ) : (
              <>
                <p>{note.text}</p>
                <div className="mt-2 space-x-2">
                  <button onClick={() => { setEditingId(note.id); setEditText(note.text); }} className="text-blue-600">ערוך</button>
                  <button onClick={() => handleDelete(note.id)} className="text-red-600">מחק</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notes;
