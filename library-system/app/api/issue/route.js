import { sql, err, FINE_PER_DAY } from '@/lib/db';
export const dynamic = 'force-dynamic';

// Active (not yet returned) loans
export async function GET() {
  const rows = await sql`SELECT t.*, b.title, (t.due_date < CURRENT_DATE) AS overdue
    FROM transactions t JOIN books b ON b.id = t.book_id
    WHERE t.returned_at IS NULL ORDER BY t.due_date`;
  return Response.json(rows);
}

// Issue a book
export async function POST(req) {
  const { book_id, member_name, member_email, days } = await req.json();
  const d = parseInt(days, 10) || 14;
  if (!book_id || !member_name?.trim()) return err('Select a book and enter the member name');
  if (d < 1 || d > 60) return err('Loan period must be 1–60 days');
  const upd = await sql`UPDATE books SET available = available - 1 WHERE id=${book_id} AND available > 0 RETURNING id`;
  if (!upd.length) return err('No copies available for this book');
  const [row] = await sql`INSERT INTO transactions (book_id, member_name, member_email, due_date)
    VALUES (${book_id}, ${member_name.trim()}, ${member_email || null}, CURRENT_DATE + ${d}::int) RETURNING *`;
  return Response.json(row, { status: 201 });
}

// Return a book (calculates fine)
export async function PUT(req) {
  const { id } = await req.json();
  const [t] = await sql`SELECT * FROM transactions WHERE id=${id} AND returned_at IS NULL`;
  if (!t) return err('Loan not found or already returned', 404);
  const [r] = await sql`UPDATE transactions
    SET returned_at = now(), fine = GREATEST(CURRENT_DATE - due_date, 0) * ${FINE_PER_DAY}
    WHERE id=${id} RETURNING fine`;
  await sql`UPDATE books SET available = available + 1 WHERE id=${t.book_id}`;
  return Response.json({ fine: r.fine });
}
