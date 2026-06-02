// Pure-content card for a single lint annotation. Rendered as a child of a
// NoteThread — the thread owns positioning, click-selects-block, hover,
// keyboard navigation. LintCard only renders the body.
export function LintCard( { item } ) {
	return (
		<p className="editor-document-annotations__lint-card-body">
			{ item.body }
		</p>
	);
}
