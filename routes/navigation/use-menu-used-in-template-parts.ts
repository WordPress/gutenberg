/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useNavigationTemplateParts from './use-navigation-template-parts';

/**
 * Returns template parts that reference a given navigation menu.
 *
 * @param {number} menuId Navigation menu ID to find usages for.
 * @return {Object} Object with templateParts array and isResolving boolean.
 */
export default function useMenuUsedInTemplateParts( menuId: number ) {
	const { partMenuRefs, isResolving } = useNavigationTemplateParts();

	const templateParts = useMemo( () => {
		if ( ! menuId ) {
			return [];
		}
		return partMenuRefs
			.filter( ( { menuIds } ) => menuIds.includes( menuId ) )
			.map( ( { part } ) => part );
	}, [ partMenuRefs, menuId ] );

	return { templateParts, isResolving };
}
