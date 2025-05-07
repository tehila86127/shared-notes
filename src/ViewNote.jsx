// ViewNote.jsx - תצוגת פתק מוצפן עם ספירה לאחור ומחיקה
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from './firebase-config';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signOut } from 'firebase/auth';
import CryptoJS from 'crypto-js';

const ViewNote = () => {
  const { id: paramId } = useParams();
  const [inputId, setInputId] = useState(paramId || '');
  const [inputKey, setInputKey] = useState('');
  const [id, setId] = useState(paramId || null);
  const [note, setNote] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!id) return;
    setNote(null);
    setError('');
    setLoading(true);

    const fetchNote = async () => {
      try {
        const docRef = doc(db, 'sharedNotes', id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('הפתק לא קיים או כבר נצפה.');
          setLoading(false);
          return;
        }

        const data = docSnap.data();
        if (data.opened) {
          setError('הפתק כבר נצפה.');
          setLoading(false);
          return;
        }

        const hash = window.location.hash;
        const key = hash && hash.length > 1 ? decodeURIComponent(hash.slice(1)) : inputKey;

        if (!key) {
          setError('יש להזין מפתח פענוח.');
          setLoading(false);
          return;
        }

        let decrypted = '';
        try {
          const bytes = CryptoJS.AES.decrypt(data.text, key);
          decrypted = bytes.toString(CryptoJS.enc.Utf8);
          if (!decrypted) throw new Error();
        } catch (e) {
          setError('המפתח שגוי — לא ניתן לפענח את הפתק.');
          setLoading(false);
          return;
        }

        try {
          await updateDoc(docRef, { opened: true });
        } catch (e) {
          console.error('שגיאה בסימון פתיחה:', e);
        }

        setNote(decrypted);
        setCountdown(data.expirySec);
        const interval = setInterval(() => {
          setCountdown(prev => {
            if (prev <= 1) {
              clearInterval(interval);
              setNote(null);
              (async () => {
                try {
                  await deleteDoc(docRef);
                } catch (e) {
                  console.error('שגיאה במחיקת הפתק:', e);
                }
              })();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        setLoading(false);

    } catch (err) {
        console.error(err);
        setError('שגיאה בטעינת הפתק.');
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  return (
    <div className="p-4">
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

      <h2 className="text-xl font-bold mb-4">פתק מחבר 📨</h2>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <input
          type="text"
          placeholder="מזהה פתק"
          className="border p-2 rounded w-full sm:w-64"
          value={inputId}
          onChange={(e) => setInputId(e.target.value)}
        />
        <input
          type="text"
          placeholder="מפתח פענוח"
          className="border p-2 rounded w-full sm:w-64"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
        />
        <button
          onClick={() => {
            if (!inputId.trim()) {
              setError('יש להזין מזהה פתק.');
              setNote(null);
              return;
            }
            setError('');
            setId(inputId.trim());
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          הצג פתק
        </button>
      </div>

      {error && <p className="text-red-500">{error}</p>}
      {loading && <p className="text-gray-500">טוען פתק...</p>}
      {note && !loading && (
        <div className={`p-4 border rounded bg-gray-100 space-y-2 transition-opacity duration-1000 ${countdown === 1 ? 'opacity-0' : 'opacity-100'}`}>
          <div>{note}</div>
          
        </div>
      )}
    </div>
  );
};

export default ViewNote;
