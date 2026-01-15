/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';

/**
 * Hook to migrate deprecated attributes to their new equivalents.
 *
 * @param {Object}   attributes    Block attributes.
 * @param {Function} setAttributes Function to update block attributes.
 */
export default function useMigrateAttributes( attributes, setAttributes ) {
	const { openSubmenusOnClick, submenuVisibility } = attributes;

	// Migrate openSubmenusOnClick to submenuVisibility
	useEffect( () => {
		if (
			openSubmenusOnClick !== undefined &&
			submenuVisibility === undefined
		) {
			setAttributes( {
				submenuVisibility: openSubmenusOnClick ? 'click' : 'hover',
				openSubmenusOnClick: undefined,
			} );
		}
	}, [ openSubmenusOnClick, submenuVisibility, setAttributes ] );
}
