import { Link } from "react-router-dom";

type NotFoundStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  backTo: string;
  backLabel: string;
};

export function NotFoundState({ eyebrow, title, description, backTo, backLabel }: NotFoundStateProps) {
  return (
    <section className="surface">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <p>
        <Link className="inline-link" to={backTo}>
          {backLabel}
        </Link>
      </p>
    </section>
  );
}
