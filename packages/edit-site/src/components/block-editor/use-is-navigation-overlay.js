/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';

export default function useIsNavigationOverlay() {
	const [ area ] = useEntityProp( 'postType', 'wp_template_part', 'area' );
	return area === 'navigation-overlay';
}
