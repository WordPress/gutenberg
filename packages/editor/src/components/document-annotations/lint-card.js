// Pure-content card for a single lint annotation. Rendered inside the Notes
// tray by the parent, which owns the card chrome (selection, click-selects-
// block, keyboard navigation). LintCard only renders the body.
export function LintCard( { item } ) {
	return (
		<p className="editor-document-annotations__lint-card-body">
			{ item.body }
		</p>
	);
}
