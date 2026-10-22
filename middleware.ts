import { NextResponse } from 'next/server';
import { auth } from './auth';

/**
 * Bloqueia todas as páginas do portal quando não houver uma sessão Google válida.
 * O callback preserva a página original para onde o usuário tentou navegar.
 */
export default auth((request) => {
  if (request.auth) return NextResponse.next();

  const login = new URL('/api/auth/signin', request.nextUrl.origin);
  login.searchParams.set('callbackUrl', request.nextUrl.href);
  return NextResponse.redirect(login);
});

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest).*)'],
};
