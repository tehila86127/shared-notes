// ShareNote.jsx - יצירת פתק שיתופי עם הצפנה בקישור
import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { db } from './firebase-config';
import { collection, addDoc } from 'firebase/firestore';
import CryptoJS from 'crypto-js';

const ShareNote = () => {
  const [user, setUser] = useState(null);
  const [text, setText] = useState('');
  const [expirySec, setExpirySec] = useState(30);
  const [link, setLink] = useState('');
  const [noteId, setNoteId] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateNote = async () => {
    if (!text.trim()) return;

    const key = CryptoJS.lib.WordArray.random(16).toString();
    const encrypted = CryptoJS.AES.encrypt(text, key).toString();

    const createdAt = Date.now();
    const docRef = await addDoc(collection(db, 'sharedNotes'), {
      text: encrypted,
      createdAt,
      expirySec,
      opened: false
    });
    setLink(`${window.location.origin}/view/${docRef.id}#${key}`);
    setEncryptionKey(key);
    setNoteId(docRef.id);
    setText('');
  };

  return (
    <div className="p-4 space-y-4">
      <nav className="flex items-center justify-between mb-6 border-b pb-3">
        <ul className="flex gap-6 text-blue-600">
          <li><a href="/notes" className="hover:underline">הפתקים שלי</a></li>
          <li><a href="/share" className="hover:underline">פתק לחבר</a></li>
          <li><a href="/view" className="hover:underline">פתק מחבר</a></li>
        </ul>
        <button
          onClick={() => {
            const auth = getAuth();
            signOut(auth).then(() => {
              window.location.href = '/';
            });
          }}
          className="bg-red-500 text-white px-4 py-1.5 rounded hover:bg-red-600"
        >
          התנתקות
        </button>
      </nav>

      <h2 className="text-xl font-bold">יצירת פתק לחבר 📩</h2>
      <textarea
        className="w-full p-2 border rounded"
        rows="4"
        placeholder="כתוב את הפתק שלך כאן..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      ></textarea>

      <div className="flex items-center space-x-2">
        <label>תוקף הפתק (בשניות):</label>
        <input
          type="number"
          className="border p-2 rounded w-24"
          min="5"
          value={expirySec}
          onChange={(e) => setExpirySec(parseInt(e.target.value))}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={handleCreateNote}
        >
          צור קישור
        </button>
      </div>

      {link && (
        <div className="mt-4 space-y-4">
          <div>
            <p>שלח את הקישור הזה לחבר:</p>
            <div className="flex items-center space-x-2">
              <a href={link} className="text-blue-600 underline">{link}</a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
                className="bg-gray-200 px-2 py-1 rounded text-sm"
              >העתק קישור</button>
              {copiedLink && <span className="text-green-600 text-sm">✓ הועתק</span>}
            </div>
          </div>
          <div>
            <p>מזהה הפתק:</p>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{noteId}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(noteId);
                  setCopiedId(true);
                  setTimeout(() => setCopiedId(false), 2000);
                }}
                className="bg-gray-200 px-2 py-1 rounded text-sm"
              >העתק מזהה</button>
              {copiedId && <span className="text-green-600 text-sm">✓ הועתק</span>}
            </div>
          </div>
          <div>
            <p>מפתח ההצפנה:</p>
            <div className="flex items-center space-x-2">
              <code className="bg-gray-100 px-2 py-1 rounded text-sm">{encryptionKey}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(encryptionKey);
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                }}
                className="bg-gray-200 px-2 py-1 rounded text-sm"
              >העתק מפתח</button>
              {copiedKey && <span className="text-green-600 text-sm">✓ הועתק</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareNote;
