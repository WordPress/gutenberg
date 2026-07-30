/**
 * Internal dependencies
 */
import type { ViewportQuery, ViewportState } from '../types';

/**
 * Returns true if the viewport matches the given query, or false otherwise.
 *
 * @param state Viewport state object.
 * @param query Query string. Includes operator and breakpoint name,
 *              space separated. Operator defaults to >=.
 *
 * @example
 *
 * ```js
 * import { store as viewportStore } from '@wordpress/viewport';
 * import { useSelect } from '@wordpress/data';
 * import { __ } from '@wordpress/i18n';
 * const ExampleComponent = () => {
 *     const isMobile = useSelect(
 *         ( select ) => select( viewportStore ).isViewportMatch( '< small' ),
 *         []
 *     );
 *
 *     return isMobile ? (
 *         <div>{ __( 'Mobile' ) }</div>
 *     ) : (
 *         <div>{ __( 'Not Mobile' ) }</div>
 *     );
 * };
 * ```
 *
 * @return Whether viewport matches query.
 */
export function isViewportMatch(
	state: ViewportState,
	query: ViewportQuery
): boolean {
	// Default to `>=` if no operator is present.
	if ( query.indexOf( ' ' ) === -1 ) {
		query = '>= ' + query;
	}

	return !! state[ query ];
}
