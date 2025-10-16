import { redirect } from 'next/navigation';

// For a Shopify embedded app, the root page should not be a public landing page.
// It should immediately redirect to the appropriate in-app page.
// The app's router will handle authentication and guide the user to either the
// pricing page (for new installs) or their dashboard.
export default function RootPage() {
  redirect('/dashboard');
}
