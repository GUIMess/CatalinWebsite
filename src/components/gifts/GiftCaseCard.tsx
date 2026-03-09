import type { Gift } from "../../types/content";

type GiftCaseCardProps = {
  gift: Gift;
};

export function GiftCaseCard({ gift }: GiftCaseCardProps) {
  return (
    <article className="card">
      <p className="tag">software as a gift</p>
      <h3>{gift.title}</h3>
      <p className="muted">{gift.recipient}</p>
      <p>
        <strong>Problem:</strong> {gift.problem}
      </p>
      <p>
        <strong>Shipped:</strong> {gift.shipped}
      </p>
      <p>
        <strong>Impact:</strong> {gift.impact}
      </p>
    </article>
  );
}

