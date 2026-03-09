import type { FormEvent } from "react";
import { getConfigValue } from "../../lib/runtimeConfig";

export function ContactForm() {
  const endpoint = getConfigValue("VITE_FORMSPREE_ENDPOINT");
  const isConfigured = Boolean(endpoint);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    if (!isConfigured) {
      event.preventDefault();
    }
  };

  return (
    <form className={`contact-form${isConfigured ? "" : " is-disabled"}`} method={isConfigured ? "post" : undefined} action={endpoint} onSubmit={handleSubmit}>
      <label htmlFor="name">Name</label>
      <input id="name" name="name" type="text" placeholder="Your name" required />

      <label htmlFor="email">Email</label>
      <input id="email" name="email" type="email" placeholder="you@company.com" required />

      <label htmlFor="message">Message</label>
      <textarea
        id="message"
        name="message"
        rows={5}
        placeholder="Project type, timeline, budget range, and what success looks like."
        required
      />

      <button type="submit" className={isConfigured ? "chip active" : "chip"} disabled={!isConfigured} aria-disabled={!isConfigured}>
        {isConfigured ? "Send Brief" : "Brief Intake Offline"}
      </button>

      {!isConfigured && (
        <p className="muted contact-hint">
          Brief intake is offline right now. Reach out on{" "}
          <a className="inline-link" href="https://www.linkedin.com/in/catalin-siegling/" target="_blank" rel="noreferrer">
            LinkedIn
          </a>{" "}
          until the form goes live.
        </p>
      )}
    </form>
  );
}
