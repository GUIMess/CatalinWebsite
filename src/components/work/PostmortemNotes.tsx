type PostmortemNotesProps = {
  notes: string[];
};

export function PostmortemNotes({ notes }: PostmortemNotesProps) {
  return (
    <section className="surface">
      <p className="eyebrow">Field Notes</p>
      <h2>Observed behavior after shipping</h2>
      <ol className="notes-list">
        {notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ol>
    </section>
  );
}
