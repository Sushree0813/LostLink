import { Link } from "@tanstack/react-router";

import { Logo } from "@/components/layout/Logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            LostLink is a centralised campus lost-and-found platform that helps students and staff
            report, discover, verify and recover belongings through one secure system.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Platform</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/browse" className="hover:text-primary">
                Browse Items
              </Link>
            </li>
            <li>
              <Link to="/how-it-works" className="hover:text-primary">
                How It Works
              </Link>
            </li>
            <li>
              <Link to="/help" className="hover:text-primary">
                Help &amp; FAQ
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-primary">
                About
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Support</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/help" className="hover:text-primary">
                Contact
              </Link>
            </li>
            <li>
              <Link to="/privacy" className="hover:text-primary">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-primary">
                Terms of Use
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-4 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} LostLink — Campus Lost and Found Management System.
      </div>
    </footer>
  );
}
