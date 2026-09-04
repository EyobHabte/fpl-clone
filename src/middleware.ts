import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  // Protect the app pages. Auth routes, the signup/login pages themselves,
  // the FPL sync endpoint, and Next's static assets are left open.
  matcher: ['/', '/transfers/:path*', '/leagues/:path*', '/settings/:path*'],
};
