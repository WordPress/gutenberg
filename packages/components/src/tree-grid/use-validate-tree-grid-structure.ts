import { useEffect } from '@wordpress/element';

const ROW_SELECTOR = 'tr:not([role]), [role="row"]';
const TREE_GRID_SELECTOR = '[role="treegrid"]';

function getAriaOwners( element: HTMLElement ) {
	if ( ! element.id ) {
		return [];
	}

	return Array.from(
		element.ownerDocument.querySelectorAll< HTMLElement >( '[aria-owns]' )
	).filter(
		( owner ) =>
			owner
				.getAttribute( 'aria-owns' )
				?.split( /\s+/ )
				.includes( element.id )
	);
}

function isContainedInOrOwnedBy(
	element: HTMLElement,
	selector: string,
	visited = new Set< HTMLElement >()
): boolean {
	if ( visited.has( element ) ) {
		return false;
	}
	visited.add( element );

	if ( element.parentElement?.closest( selector ) ) {
		return true;
	}

	return getAriaOwners( element ).some(
		( owner ) =>
			owner.matches( selector ) ||
			isContainedInOrOwnedBy( owner, selector, visited )
	);
}

function isOwnedByRowInTreeGrid(
	element: HTMLElement,
	visited = new Set< HTMLElement >()
): boolean {
	if ( visited.has( element ) ) {
		return false;
	}
	visited.add( element );

	return getAriaOwners( element ).some( ( owner ) => {
		const row = owner.matches( ROW_SELECTOR )
			? owner
			: owner.closest< HTMLElement >( ROW_SELECTOR );

		return row
			? isContainedInOrOwnedBy( row, TREE_GRID_SELECTOR )
			: isOwnedByRowInTreeGrid( owner, visited );
	} );
}

export function useValidateTreeGridStructure(
	componentName: 'TreeGridRow' | 'TreeGridCell',
	elementRef: React.RefObject< HTMLElement >
) {
	useEffect( () => {
		const element = elementRef.current;
		if ( ! element ) {
			return;
		}

		const row =
			element.parentElement?.closest< HTMLElement >( ROW_SELECTOR );
		const hasValidStructure =
			componentName === 'TreeGridRow'
				? isContainedInOrOwnedBy( element, TREE_GRID_SELECTOR )
				: ( row &&
						isContainedInOrOwnedBy( row, TREE_GRID_SELECTOR ) ) ||
				  isOwnedByRowInTreeGrid( element );

		if ( ! hasValidStructure ) {
			throw new Error(
				componentName === 'TreeGridRow'
					? 'TreeGridRow must be rendered inside an element with role="treegrid".'
					: 'TreeGridCell must be rendered as a cell in a row that belongs to an element with role="treegrid".'
			);
		}
	} );
}
