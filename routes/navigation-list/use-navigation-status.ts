/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useNavigationTemplateParts from './use-navigation-template-parts';

export default function useNavigationStatus(): {
	statusMap: Record< number, number >;
	isResolving: boolean;
} {
	const { partMenuRefs, isResolving } = useNavigationTemplateParts();

	const statusMap = useMemo( () => {
		const counts: Record< number, number > = {};

		for ( const { menuIds } of partMenuRefs ) {
			for ( const id of menuIds ) {
				counts[ id ] = ( counts[ id ] ?? 0 ) + 1;
			}
		}

		return counts;
	}, [ partMenuRefs ] );

	return { statusMap, isResolving };
}
