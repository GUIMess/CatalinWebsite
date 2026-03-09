import { ContactForm } from "../components/contact/ContactForm";
import { usePageMeta } from "../lib/seo";

export function ContactPage() {
  usePageMeta({
    title: "Contact | Catalin Siegling",
    description: "Send project context, constraints, and timeline to start a focused product build.",
    path: "/contact"
  });

  return (
    <div className="stack">
      <section className="surface">
        <p className="eyebrow">Contact</p>
        <h1>Have a messy product problem?</h1>
        <p>
          Send context, constraints, and timeline. I will respond with a practical first move.
        </p>
      </section>
      <section className="surface">
        <ContactForm />
      </section>
    </div>
  );
}
