import { useLocation } from "react-router-dom";
import { NotFoundState } from "../components/routing/NotFoundState";
import { usePageMeta } from "../lib/seo";

export function NotFoundPage() {
  const location = useLocation();

  usePageMeta({
    title: "Page Not Found | Catalin Siegling",
    description: "The page you requested is not active on this portfolio.",
    path: location.pathname || "/",
    robots: "noindex,nofollow"
  });

  return (
    <NotFoundState
      eyebrow="404"
      title="Route not found"
      description="Use the active sections to return to current work."
      backTo="/"
      backLabel="Back home"
    />
  );
}
