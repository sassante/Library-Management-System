import { sql, err } from '@/lib/db';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const q = '%' + (new URL(req.url).searchParams.get('q') || '') + '%';
  const rows = await sql`SELECT * FROM books WHERE title ILIKE ${q} OR author ILIKE ${q} OR isbn ILIKE ${q} ORDER BY title`;
  return Response.json(rows);
}

export async function POST(req) {
  const { title, author, isbn, copies } = await req.json();
  const n = parseInt(copies, 10);
  if (!title?.trim() || !author?.trim() || !isbn?.trim()) return err('Title, author and ISBN are required');
  if (!Number.isInteger(n) || n < 1) return err('Copies must be at least 1');
  try {
    const [row] = await sql`INSERT INTO books (title, author, isbn, copies, available)
      VALUES (${title.trim()}, ${author.trim()}, ${isbn.trim()}, ${n}, ${n}) RETURNING *`;
    return Response.json(row, { status: 201 });
  } catch (e) {
    return e.code === '23505' ? err('A book with this ISBN already exists') : err('Database error', 500);
  }
}
