/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useNavigationTemplateParts from './use-navigation-template-parts';

/**
 * Returns a map of navigation menu IDs to their usage count in template parts.
 *
 * @return {Object} Object with statusMap (menuId -> count) and isResolving boolean.
 */
export default function useNavigationStatus() {
	const { partMenuRefs, isResolving } = useNavigationTemplateParts();

	const statusMap = useMemo( () => {
		const counts: { [ key: number ]: number } = {};
		partMenuRefs.forEach( ( { menuIds } ) => {
			menuIds.forEach( ( id ) => {
				counts[ id ] = ( counts[ id ] || 0 ) + 1;
			} );
		} );
		return counts;
	}, [ partMenuRefs ] );

	return { statusMap, isResolving };
}
