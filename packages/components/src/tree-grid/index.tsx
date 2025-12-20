/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
import { forwardRef, useCallback } from '@wordpress/element';
import { UP, DOWN, LEFT, RIGHT, HOME, END } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import RovingTabIndexContainer from './roving-tab-index';
import type { TreeGridProps } from './types';
import type { WordPressComponentProps } from '../context';

/**
 * Return focusables in a row element, excluding those from other branches
 * nested within the row.
 *
 * @param rowElement The DOM element representing the row.
 *
 * @return The array of focusables in the row.
 */
function getRowFocusables( rowElement: HTMLElement ) {
	const focusablesInRow = focus.focusable.find( rowElement, {
		sequential: true,
	} );

	return focusablesInRow.filter( ( focusable ) => {
		return focusable.closest( '[role="row"]' ) === rowElement;
	} );
}

/**
 * Renders both a table and tbody element, used to create a tree hierarchy.
 *
 */
function UnforwardedTreeGrid(
	{
		children,
		onExpandRow = () => {},
		onCollapseRow = () => {},
		onFocusRow = () => {},
		applicationAriaLabel,
		...props
	}: WordPressComponentProps< TreeGridProps, 'table', false >,
	/** A ref to the underlying DOM table element. */
	ref: React.ForwardedRef< HTMLTableElement >
) {
	const onKeyDown = useCallback(
		( event: React.KeyboardEvent< HTMLTableElement > ) => {
			const { keyCode, metaKey, ctrlKey, altKey } = event;

			// The shift key is intentionally absent from the following list,
			// to enable shift + up/down to select items from the list.
			const hasModifierKeyPressed = metaKey || ctrlKey || altKey;

			if (
				hasModifierKeyPressed ||
				! ( [ UP, DOWN, LEFT, RIGHT, HOME, END ] as number[] ).includes(
					keyCode
				)
			) {
				return;
			}

			// The event will be handled, stop propagation.
			event.stopPropagation();

			const { activeElement } = document;
			const { currentTarget: treeGridElement } = event;

			if (
				! activeElement ||
				! treeGridElement.contains( activeElement )
			) {
				return;
			}

			// Calculate the columnIndex of the active element.
			const activeRow =
				activeElement.closest< HTMLElement >( '[role="row"]' );

			if ( ! activeRow ) {
				return;
			}

			const focusablesInRow = getRowFocusables( activeRow );
			const currentColumnIndex = focusablesInRow.indexOf(
				activeElement as HTMLElement
			);
			const canExpandCollapse = 0 === currentColumnIndex;
			const cannotFocusNextColumn =
				canExpandCollapse &&
				( activeRow.getAttribute( 'data-expanded' ) === 'false' ||
					activeRow.getAttribute( 'aria-expanded' ) === 'false' ) &&
				keyCode === RIGHT;

			if ( ( [ LEFT, RIGHT ] as number[] ).includes( keyCode ) ) {
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
							activeRow.getAttribute( 'data-expanded' ) ===
								'true' ||
							activeRow.getAttribute( 'aria-expanded' ) === 'true'
						) {
							onCollapseRow( activeRow );
							event.preventDefault();
							return;
						}
						// If a row is focused, and it is collapsed, moves to the parent row (if there is one).
						const level = Math.max(
							parseInt(
								activeRow?.getAttribute( 'aria-level' ) ?? '1',
								10
							) - 1,
							1
						);
						const rows = Array.from(
							treeGridElement.querySelectorAll< HTMLElement >(
								'[role="row"]'
							)
						);
						let parentRow = activeRow;
						const currentRowIndex = rows.indexOf( activeRow );
						for ( let i = currentRowIndex; i >= 0; i-- ) {
							const ariaLevel =
								rows[ i ].getAttribute( 'aria-level' );

							if (
								ariaLevel !== null &&
								parseInt( ariaLevel, 10 ) === level
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
							activeRow.getAttribute( 'data-expanded' ) ===
								'false' ||
							activeRow.getAttribute( 'aria-expanded' ) ===
								'false'
						) {
							onExpandRow( activeRow );
							event.preventDefault();
							return;
						}
						// If a row is focused, and it is expanded, focuses the next cell in the row.
						const focusableItems = getRowFocusables( activeRow );
						if ( focusableItems.length > 0 ) {
							focusableItems[ nextIndex ]?.focus();
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
			} else if ( ( [ UP, DOWN ] as number[] ).includes( keyCode ) ) {
				// Calculate the rowIndex of the next row.
				const rows = Array.from(
					treeGridElement.querySelectorAll< HTMLElement >(
						'[role="row"]'
					)
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

				// Let consumers know the row that was originally focused,
				// and the row that is now in focus.
				onFocusRow( event, activeRow, rows[ nextRowIndex ] );

				// Prevent key use for anything else. This ensures Voiceover
				// doesn't try to handle key navigation.
				event.preventDefault();
			} else if ( ( [ HOME, END ] as number[] ).includes( keyCode ) ) {
				// Calculate the rowIndex of the next row.
				const rows = Array.from(
					treeGridElement.querySelectorAll< HTMLElement >(
						'[role="row"]'
					)
				);
				const currentRowIndex = rows.indexOf( activeRow );
				let nextRowIndex;

				if ( keyCode === HOME ) {
					nextRowIndex = 0;
				} else {
					nextRowIndex = rows.length - 1;
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

				// Let consumers know the row that was originally focused,
				// and the row that is now in focus.
				onFocusRow( event, activeRow, rows[ nextRowIndex ] );

				// Prevent key use for anything else. This ensures Voiceover
				// doesn't try to handle key navigation.
				event.preventDefault();
			}
		},
		[ onExpandRow, onCollapseRow, onFocusRow ]
	);

	/* Disable reason: A treegrid is implemented using a table element. */
	/* eslint-disable jsx-a11y/no-noninteractive-element-to-interactive-role */
	return (
		<RovingTabIndexContainer>
			{
				// Prevent browser mode from triggering in NVDA by wrapping List View
				// in a role=application wrapper.
				// see: https://github.com/WordPress/gutenberg/issues/43729
			 }
			<div role="application" aria-label={ applicationAriaLabel }>
				<table
					{ ...props }
					role="treegrid"
					onKeyDown={ onKeyDown }
					ref={ ref }
				>
					<tbody>{ children }</tbody>
				</table>
			</div>
		</RovingTabIndexContainer>
	);
	/* eslint-enable jsx-a11y/no-noninteractive-element-to-interactive-role */
}

/**
 * `TreeGrid` is used to create a tree hierarchy.
 * It is not a visually styled component, but instead helps with adding
 * keyboard navigation and roving tab index behaviors to tree grid structures.
 *
 * A tree grid is a hierarchical 2 dimensional UI component, for example it could be
 * used to implement a file system browser.
 *
 * A tree grid allows the user to navigate using arrow keys.
 * Up/down to navigate vertically across rows, and left/right to navigate horizontally
 * between focusables in a row.
 *
 * The `TreeGrid` renders both a `table` and `tbody` element, and is intended to be used
 * with `TreeGridRow` (`tr`) and `TreeGridCell` (`td`) to build out a grid.
 *
 * ```jsx
 * function TreeMenu() {
 * 	return (
 * 		<TreeGrid>
 * 			<TreeGridRow level={ 1 } positionInSet={ 1 } setSize={ 2 }>
 * 				<TreeGridCell>
 * 					{ ( props ) => (
 * 						<Button onClick={ onSelect } { ...props }>Select</Button>
 * 					) }
 * 				</TreeGridCell>
 * 				<TreeGridCell>
 * 					{ ( props ) => (
 * 						<Button onClick={ onMove } { ...props }>Move</Button>
 * 					) }
 * 				</TreeGridCell>
 * 			</TreeGridRow>
 * 			<TreeGridRow level={ 1 } positionInSet={ 2 } setSize={ 2 }>
 * 				<TreeGridCell>
 * 					{ ( props ) => (
 * 						<Button onClick={ onSelect } { ...props }>Select</Button>
 * 					) }
 * 				</TreeGridCell>
 * 				<TreeGridCell>
 * 					{ ( props ) => (
 * 						<Button onClick={ onMove } { ...props }>Move</Button>
 * 					) }
 * 				</TreeGridCell>
 * 			</TreeGridRow>
 * 			<TreeGridRow level={ 2 } positionInSet={ 1 } setSize={ 1 }>
 * 				<TreeGridCell>
 * 					{ ( props ) => (
 * 						<Button onClick={ onSelect } { ...props }>Select</Button>
 * 					) }
 * 				</TreeGridCell>
 * 				<TreeGridCell>
 * 					{ ( props ) => (
 * 						<Button onClick={ onMove } { ...props }>Move</Button>
 * 					) }
 * 				</TreeGridCell>
 * 			</TreeGridRow>
 * 		</TreeGrid>
 * 	);
 * }
 * ```
 *
 * @see {@link https://www.w3.org/TR/wai-aria-practices/examples/treegrid/treegrid-1.html}
 */
export const TreeGrid = forwardRef( UnforwardedTreeGrid );

export default TreeGrid;
export { default as TreeGridRow } from './row';
export { default as TreeGridCell } from './cell';
export { default as TreeGridItem } from './item';
