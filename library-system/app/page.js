'use client';
import { useEffect, useState } from 'react';

async function api(url, method, body) {
  const r = await fetch(url, body || method ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const d = await r.json();
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}

export default function Home() {
  const [tab, setTab] = useState('books');
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [rep, setRep] = useState(null);
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const [f, setF] = useState({ title: '', author: '', isbn: '', copies: 1 });
  const [iss, setIss] = useState({ book_id: '', member_name: '', member_email: '', days: 14 });

  const run = async (fn) => { try { setMsg(''); await fn(); } catch (e) { setMsg(e.message); } };
  const load = () => run(async () => {
    setBooks(await api('/api/books?q=' + encodeURIComponent(q)));
    setLoans(await api('/api/issue'));
    setRep(await api('/api/reports'));
  });
  useEffect(() => { load(); }, [q]);

  const addBook = () => run(async () => { await api('/api/books', 'POST', f); setF({ title: '', author: '', isbn: '', copies: 1 }); await load(); });
  const delBook = (id) => confirm('Delete this book?') && run(async () => { await api('/api/books/' + id, 'DELETE'); await load(); });
  const issue = () => run(async () => { await api('/api/issue', 'POST', iss); setIss({ ...iss, member_name: '', member_email: '' }); await load(); });
  const ret = (id) => run(async () => { const r = await api('/api/issue', 'PUT', { id }); if (+r.fine > 0) alert('Returned. Fine due: GHS ' + r.fine); await load(); });

  return (
    <main>
      <h1>📚 Library Management System</h1>
      <nav>{['books', 'issue', 'reports'].map(t => <button key={t} className={tab === t ? 'on' : ''} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}</nav>
      {msg && <p className="msg">{msg}</p>}

      {tab === 'books' && <>
        <div className="card">
          <h3>Add a book</h3>
          <input placeholder="Title" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} />
          <input placeholder="Author" value={f.author} onChange={e => setF({ ...f, author: e.target.value })} />
          <input placeholder="ISBN" value={f.isbn} onChange={e => setF({ ...f, isbn: e.target.value })} />
          <input type="number" min="1" style={{ width: 70 }} value={f.copies} onChange={e => setF({ ...f, copies: e.target.value })} />
          <button className="act" onClick={addBook}>Add</button>
        </div>
        <div className="card">
          <input placeholder="Search title, author or ISBN…" value={q} onChange={e => setQ(e.target.value)} style={{ width: '100%' }} />
          <table><thead><tr><th>Title</th><th>Author</th><th>ISBN</th><th>Available</th><th></th></tr></thead>
            <tbody>{books.map(b => <tr key={b.id}><td>{b.title}</td><td>{b.author}</td><td>{b.isbn}</td><td>{b.available}/{b.copies}</td>
              <td><button className="act del" onClick={() => delBook(b.id)}>Delete</button></td></tr>)}</tbody></table>
        </div>
      </>}

      {tab === 'issue' && <>
        <div className="card">
          <h3>Issue a book</h3>
          <select value={iss.book_id} onChange={e => setIss({ ...iss, book_id: e.target.value })}>
            <option value="">Select book…</option>
            {books.filter(b => b.available > 0).map(b => <option key={b.id} value={b.id}>{b.title} ({b.available} left)</option>)}
          </select>
          <input placeholder="Member name" value={iss.member_name} onChange={e => setIss({ ...iss, member_name: e.target.value })} />
          <input placeholder="Member email (optional)" value={iss.member_email} onChange={e => setIss({ ...iss, member_email: e.target.value })} />
          <input type="number" style={{ width: 70 }} value={iss.days} onChange={e => setIss({ ...iss, days: e.target.value })} /> days
          <button className="act" onClick={issue}>Issue</button>
        </div>
        <div className="card">
          <h3>Books currently issued</h3>
          <table><thead><tr><th>Book</th><th>Member</th><th>Due</th><th></th></tr></thead>
            <tbody>{loans.map(l => <tr key={l.id}><td>{l.title}</td><td>{l.member_name}</td>
              <td className={l.overdue ? 'late' : ''}>{String(l.due_date).slice(0, 10)}{l.overdue ? ' (overdue)' : ''}</td>
              <td><button className="act" onClick={() => ret(l.id)}>Return</button></td></tr>)}</tbody></table>
        </div>
      </>}

      {tab === 'reports' && rep && <>
        <div className="stats">
          <div><b>{rep.totals.titles}</b>Titles</div><div><b>{rep.totals.copies}</b>Total copies</div>
          <div><b>{rep.totals.issued}</b>Issued</div><div><b className="late">{rep.totals.overdue}</b>Overdue</div>
          <div><b>GHS {rep.totals.fines}</b>Fines collected</div>
        </div>
        <div className="card"><h3>Most borrowed</h3>
          <table><tbody>{rep.popular.map(p => <tr key={p.title}><td>{p.title}</td><td>{p.times}×</td></tr>)}</tbody></table></div>
        <div className="card"><h3>Recent transactions</h3>
          <table><thead><tr><th>Book</th><th>Member</th><th>Issued</th><th>Returned</th><th>Fine</th></tr></thead>
            <tbody>{rep.history.map(h => <tr key={h.id}><td>{h.title}</td><td>{h.member_name}</td><td>{String(h.issued_at).slice(0, 10)}</td>
              <td>{h.returned_at ? String(h.returned_at).slice(0, 10) : '—'}</td><td>{h.fine}</td></tr>)}</tbody></table></div>
      </>}
    </main>
  );
}
