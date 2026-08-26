/**
 * Feature Comparison Table — frontend view script
 *
 * Handles hover-column highlighting for the `has-hover-highlight-column` and
 * `has-hover-highlight-both` modes. CSS alone cannot highlight a column on
 * row-hover because there is no parent/ancestor selector that traverses rows.
 *
 * This script is intentionally minimal: it attaches a single delegated event
 * listener to each table and toggles a CSS class on cells in the hovered column.
 * No dependencies are required.
 */

( function () {
	/**
	 * Attach column-hover behaviour to a single .fct-table element.
	 *
	 * @param {HTMLTableElement} table - The <table> to instrument.
	 */
	function initColumnHover( table ) {
		let activeColIndex = -1;

		/**
		 * Add the `is-col-hovered` class to every cell in `colIndex`.
		 *
		 * @param {number} colIndex - Zero-based column index.
		 */
		function highlightColumn( colIndex ) {
			if ( colIndex === activeColIndex ) {
				return;
			}
			clearHighlight();
			activeColIndex = colIndex;

			const rows = table.querySelectorAll( 'tr' );
			rows.forEach( ( row ) => {
				const cell = row.cells[ colIndex ];
				if ( cell ) {
					cell.classList.add( 'is-col-hovered' );
				}
			} );
		}

		/**
		 * Remove `is-col-hovered` from all cells.
		 */
		function clearHighlight() {
			activeColIndex = -1;
			table
				.querySelectorAll( '.is-col-hovered' )
				.forEach( ( cell ) =>
					cell.classList.remove( 'is-col-hovered' )
				);
		}

		table.addEventListener( 'mouseover', ( event ) => {
			const cell = event.target.closest( 'td, th' );
			if ( ! cell ) {
				return;
			}
			highlightColumn( cell.cellIndex );
		} );

		table.addEventListener( 'mouseleave', clearHighlight );
	}

	// Instrument all tables in blocks that require column highlighting.
	document
		.querySelectorAll(
			'.wp-block-feature-comparison-table.has-hover-highlight-column .fct-table,' +
				'.wp-block-feature-comparison-table.has-hover-highlight-both .fct-table'
		)
		.forEach( initColumnHover );
} )();
