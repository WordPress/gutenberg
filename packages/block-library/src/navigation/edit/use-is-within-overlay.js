import { useEntityProp } from '@wordpress/core-data';
import { NAVIGATION_OVERLAY_TEMPLATE_PART_AREA } from '../constants';

export default function useIsWithinOverlay() {
	const [ area ] = useEntityProp( 'postType', 'wp_template_part', 'area' );
	return area === NAVIGATION_OVERLAY_TEMPLATE_PART_AREA;
}
