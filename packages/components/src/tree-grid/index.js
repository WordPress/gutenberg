/**
 * External dependencies
 */
import { includes } from 'lodash';

/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
import { forwardRef, useCallback } from '@wordpress/element';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import RovingTabIndexContainer from './roving-tab-index';

/**
 * Return focusables in a row element, excluding those from other branches
 * nested within the row.
 *
 * @param {Element} rowElement The DOM element representing the row.
 *
 * @return {?Array} The array of focusables in the row.
 */
function getRowFocusables( rowElement ) {
	const focusablesInRow = focus.focusable.find( rowElement, {
		sequential: true,
	} );

	if ( ! focusablesInRow || ! focusablesInRow.length ) {
		return;
	}

	return focusablesInRow.filter( ( focusable ) => {
		return focusable.closest( '[role="row"]' ) === rowElement;
	} );
}

/**
 * Renders both a table and tbody element, used to create a tree hierarchy.
 *
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/components/src/tree-grid/README.md
 * @param {Object}    props               Component props.
 * @param {WPElement} props.children      Children to be rendered.
 * @param {Function}  props.onExpandRow   Callback to fire when row is expanded.
 * @param {Function}  props.onCollapseRow Callback to fire when row is collapsed.
 * @param {Object}    ref                 A ref to the underlying DOM table element.
 */
function TreeGrid(
	{ children, onExpandRow = () => {}, onCollapseRow = () => {}, ...props },
	ref
) {
	const onKeyDown = useCallback(
		( event ) => {
			const { keyCode, metaKey, ctrlKey, altKey, shiftKey } = event;

			const hasModifierKeyPressed =
				metaKey || ctrlKey || altKey || shiftKey;

			if (
				hasModifierKeyPressed ||
				! includes( [ UP, DOWN, LEFT, RIGHT ], keyCode )
			) {
				return;
			}

			// The event will be handled, stop propagation.
			event.stopPropagation();

			const { activeElement } = document;
			const { currentTarget: treeGridElement } = event;
			if ( ! treeGridElement.contains( activeElement ) ) {
				return;
			}

			// Calculate the columnIndex of the active element.
			const activeRow = activeElement.closest( '[role="row"]' );
			const focusablesInRow = getRowFocusables( activeRow );
			const currentColumnIndex = focusablesInRow.indexOf( activeElement );
			const canExpandCollapse = 0 === currentColumnIndex;
			const cannotFocusNextColumn =
				activeRow.getAttribute( 'aria-expanded' ) === 'false' &&
				keyCode !== LEFT;

			if ( includes( [ LEFT, RIGHT ], keyCode ) ) {
				// Calculate to the next element.
				let nextIndex;
				if ( keyCode === LEFT ) {
					nextIndex = Math.max( 0, currentColumnIndex - 1 );
				} else {
					nextIndex = Math.min(
						currentColumnIndex + 1,
						focusablesInRow.length - 1
					);
				}

				// Focus is at the left most column.
				if ( canExpandCollapse ) {
					if ( keyCode === LEFT ) {
						// Left:
						// If a row is focused, and it is expanded, collapses the current row.
						if (
							activeRow.getAttribute( 'aria-expanded' ) === 'true'
						) {
							onCollapseRow( activeRow );
							event.preventDefault();
							return;
						}
						// If a row is focused, and it is collapsed, moves to the parent row (if there is one).
						const level = Math.max(
							parseInt( activeRow?.ariaLevel ?? 1, 10 ) - 1,
							1
						);
						const rows = Array.from(
							treeGridElement.querySelectorAll( '[role="row"]' )
						);
						let parentRow = activeRow;
						const currentRowIndex = rows.indexOf( activeRow );
						for ( let i = currentRowIndex; i >= 0; i-- ) {
							if (
								parseInt( rows[ i ].ariaLevel, 10 ) === level
							) {
								parentRow = rows[ i ];
								break;
							}
						}
						getRowFocusables( parentRow )?.[ 0 ]?.focus();
					}
					if ( keyCode === RIGHT ) {
						// Right:
						// If a row is focused, and it is collapsed, expands the current row.
						if (
							activeRow.getAttribute( 'aria-expanded' ) ===
							'false'
						) {
							onExpandRow( activeRow );
							event.preventDefault();
							return;
						}
						// If a row is focused, and it is expanded, focuses the rightmost cell in the row.
						const focusableItems = getRowFocusables( activeRow );
						if ( focusableItems.length > 0 ) {
							focusableItems[
								focusableItems.length - 1
							]?.focus();
						}
					}
					// Prevent key use for anything else. For example, Voiceover
					// will start reading text on continued use of left/right arrow
					// keys.
					event.preventDefault();
					return;
				}

				// Focus the next element. If at most left column and row is collapsed, moving right is not allowed as this will expand. However, if row is collapsed, moving left is allowed.
				if ( cannotFocusNextColumn ) {
					return;
				}
				focusablesInRow[ nextIndex ].focus();

				// Prevent key use for anything else. This ensures Voiceover
				// doesn't try to handle key navigation.
				event.preventDefault();
			} else if ( includes( [ UP, DOWN ], keyCode ) ) {
				// Calculate the rowIndex of the next row.
				const rows = Array.from(
					treeGridElement.querySelectorAll( '[role="row"]' )
				);
				const currentRowIndex = rows.indexOf( activeRow );
				let nextRowIndex;

				if ( keyCode === UP ) {
					nextRowIndex = Math.max( 0, currentRowIndex - 1 );
				} else {
					nextRowIndex = Math.min(
						currentRowIndex + 1,
						rows.length - 1
					);
				}

				// Focus is either at the top or bottom edge of the grid. Do nothing.
				if ( nextRowIndex === currentRowIndex ) {
					// Prevent key use for anything else. For example, Voiceover
					// will start navigating horizontally when reaching the vertical
					// bounds of a table.
					event.preventDefault();
					return;
				}

				// Get the focusables in the next row.
				const focusablesInNextRow = getRowFocusables(
					rows[ nextRowIndex ]
				);

				// If for some reason there are no focusables in the next row, do nothing.
				if ( ! focusablesInNextRow || ! focusablesInNextRow.length ) {
					// Prevent key use for anything else. For example, Voiceover
					// will still focus text when using arrow keys, while this
					// component should limit navigation to focusables.
					event.preventDefault();
					return;
				}

				// Try to focus the element in the next row that's at a similar column to the activeElement.
				const nextIndex = Math.min(
					currentColumnIndex,
					focusablesInNextRow.length - 1
				);
				focusablesInNextRow[ nextIndex ].focus();

				// Prevent key use for anything else. This ensures Voiceover
				// doesn't try to handle key navigation.
				event.preventDefault();
			}
		},
		[ onExpandRow, onCollapseRow ]
	);

	/* Disable reason: A treegrid is implemented using a table element. */
	/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
	return (
		<RovingTabIndexContainer>
			<table
				{ ...props }
				role="treegrid"
				onKeyDown={ onKeyDown }
				ref={ ref }
			>
				<tbody>{ children }</tbody>
			</table>
		</RovingTabIndexContainer>
	);
	/* eslint-enable jsx-a11y/no-noninteractive-element-to-interactive-role */
}

export default forwardRef( TreeGrid );
export { default as TreeGridRow } from './row';
export { default as TreeGridCell } from './cell';
export { default as TreeGridItem } from './item';
