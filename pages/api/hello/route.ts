// app/api/hello/route.ts
export async function GET() {
  return new Response(JSON.stringify({ name: 'John Doe' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
