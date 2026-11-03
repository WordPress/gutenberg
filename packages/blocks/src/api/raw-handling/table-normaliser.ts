import normaliseBlocks from './normalise-blocks';

/**
 * Unwraps tables that are only being used for layout, such as those found in
 * HTML emails, so their content is pasted as normal blocks instead of a
 * Table block. A table is considered layout-only when every one of its rows
 * has exactly one cell, since a genuine data table needs at least two cells
 * in some row to express a relationship between them.
 *
 * Nested layout tables (a common pattern for cross-client email styling) are
 * unwrapped one level at a time as this filter runs on each table from the
 * innermost to the outermost, so a real data table nested several layout
 * tables deep is promoted all the way up while being left untouched itself.
 *
 * @see https://github.com/WordPress/gutenberg/issues/4171
 *
 * @param node The node to normalise, if it is a `<table>`.
 */
export default function tableNormaliser( node: Node ): void {
	if ( node.nodeName !== 'TABLE' ) {
		return;
	}

	const table = node as HTMLTableElement;
	const rows = Array.from( table.rows );

	if ( ! rows.length ) {
		return;
	}

	const cellsHTML: string[] = [];

	for ( const row of rows ) {
		if ( row.cells.length !== 1 ) {
			// A row with more than one cell means this table conveys a real
			// row/column relationship, so leave it as a Table block.
			return;
		}

		cellsHTML.push( row.cells[ 0 ].innerHTML );
	}

	const doc = table.ownerDocument;
	const wrapper = doc.createElement( 'div' );
	// Each row is normalised on its own, and only then joined, so that plain
	// text in adjacent rows doesn't get merged into a single paragraph.
	wrapper.innerHTML = cellsHTML
		.map( ( cellHTML ) => normaliseBlocks( cellHTML ) )
		.join( '' );

	table.replaceWith( ...Array.from( wrapper.childNodes ) );
}
