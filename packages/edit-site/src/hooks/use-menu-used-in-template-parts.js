/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { TEMPLATE_PART_POST_TYPE } from '../utils/constants';

/**
 * Checks if a template part's content references a navigation menu by ID.
 *
 * @param {string}        content - Raw content of the template part.
 * @param {string|number} menuId  - Navigation menu ID to search for.
 * @return {boolean} True if the template part contains a navigation block referencing the menu.
 */
function templatePartReferencesMenu( content, menuId ) {
	if ( ! content || menuId === null || menuId === undefined ) {
		return false;
	}
	// Match <!-- wp:navigation {"ref":ID or <!-- wp:navigation {"ref": "ID"
	const refPattern = new RegExp(
		`<!-- wp:navigation[^>]*"ref"[^:]*:\\s*["']?${ menuId }["']?`,
		'i'
	);
	return refPattern.test( content );
}

/**
 * Hook that returns template parts that reference a given navigation menu.
 *
 * Uses client-side parsing of template part content for the "used in" relationship.
 * Acceptable for prototype; production would want a server-side index.
 *
 * @param {string|number} menuId - The navigation menu ID to find usages for.
 * @return {Object} { templateParts: Array, isResolving: boolean, hasResolved: boolean }
 */
export default function useMenuUsedInTemplateParts( menuId ) {
	const { records } = useEntityRecords( 'postType', TEMPLATE_PART_POST_TYPE, {
		per_page: -1,
		status: [ 'publish', 'draft' ],
	} );

	const templateParts = useMemo( () => {
		if ( ! records || ! menuId ) {
			return [];
		}
		return records.filter( ( tp ) =>
			templatePartReferencesMenu( tp.content?.raw, menuId )
		);
	}, [ records, menuId ] );

	return {
		templateParts,
		isResolving: ! records,
		hasResolved: !! records,
	};
}
