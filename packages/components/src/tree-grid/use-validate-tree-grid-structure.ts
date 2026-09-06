import { useEffect } from '@wordpress/element';

export function useValidateTreeGridStructure(
	componentName: 'TreeGridRow' | 'TreeGridCell',
	elementRef: React.RefObject< HTMLElement >
) {
	useEffect( () => {
		const element = elementRef.current;
		if ( ! element ) {
			return;
		}

		let row: HTMLElement | null = element;
		if ( componentName === 'TreeGridCell' ) {
			row = element.parentElement?.matches( 'tr, [role="row"]' )
				? element.parentElement
				: null;
		}
		const treeGrid = row?.closest( '[role="treegrid"]' );

		if ( ! row || ! treeGrid ) {
			throw new Error(
				componentName === 'TreeGridRow'
					? 'TreeGridRow must be rendered inside an element with role="treegrid".'
					: 'TreeGridCell must be rendered as a cell in a row that belongs to an element with role="treegrid".'
			);
		}
	} );
}
