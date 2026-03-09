import gifts from "../content/gifts.json";
import type { Gift } from "../types/content";
import { GiftCaseCard } from "../components/gifts/GiftCaseCard";
import { usePageMeta } from "../lib/seo";

const typedGifts = gifts as Gift[];

export function GiftsPage() {
  usePageMeta({
    title: "Software Gifts | Catalin Siegling",
    description:
      "Small shipped tools built for real people with clear constraints and measurable outcomes.",
    path: "/gifts"
  });

  return (
    <div className="stack">
      <section className="surface">
        <p className="eyebrow">Software as a Gift</p>
        <h1>Small tools for real people under real constraints</h1>
        <p>
          This is where shipping meets empathy: focused tools, clear outcomes, and measurable impact.
        </p>
      </section>
      <section className="card-grid">
        {typedGifts.map((gift) => (
          <GiftCaseCard key={gift.id} gift={gift} />
        ))}
      </section>
    </div>
  );
}
