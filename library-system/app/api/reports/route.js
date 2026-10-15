import { sql } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET() {
  const [totals] = await sql`SELECT
    (SELECT COUNT(*)::int FROM books) AS titles,
    (SELECT COALESCE(SUM(copies),0)::int FROM books) AS copies,
    (SELECT COUNT(*)::int FROM transactions WHERE returned_at IS NULL) AS issued,
    (SELECT COUNT(*)::int FROM transactions WHERE returned_at IS NULL AND due_date < CURRENT_DATE) AS overdue,
    (SELECT COALESCE(SUM(fine),0)::float FROM transactions) AS fines`;
  const popular = await sql`SELECT b.title, COUNT(*)::int AS times FROM transactions t
    JOIN books b ON b.id=t.book_id GROUP BY b.title ORDER BY times DESC LIMIT 5`;
  const history = await sql`SELECT t.id, b.title, t.member_name, t.issued_at, t.returned_at, t.fine
    FROM transactions t JOIN books b ON b.id=t.book_id ORDER BY t.issued_at DESC LIMIT 20`;
  return Response.json({ totals, popular, history });
}
