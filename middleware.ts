export const config = {
  matcher: '/((?!favicon.ico).*)',
};

export default function middleware(request: Request) {
  const expectedUser = process.env.BASIC_AUTH_USER ?? 'admin';
  const expectedPass = process.env.BASIC_AUTH_PASSWORD ?? '';

  if (!expectedPass) {
    return new Response('BASIC_AUTH_PASSWORD env var not set', { status: 500 });
  }

  const header = request.headers.get('authorization');
  const expected = 'Basic ' + btoa(`${expectedUser}:${expectedPass}`);

  if (header === expected) return;

  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="ds-audit-dashboard"' },
  });
}
