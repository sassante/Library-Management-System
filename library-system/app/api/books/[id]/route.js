import { sql, err } from '@/lib/db';

export async function DELETE(_, { params }) {
  const id = Number(params.id);
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM transactions WHERE book_id=${id} AND returned_at IS NULL`;
  if (count > 0) return err('Cannot delete: copies of this book are currently issued');
  await sql`DELETE FROM transactions WHERE book_id=${id}`;
  await sql`DELETE FROM books WHERE id=${id}`;
  return Response.json({ ok: true });
}
