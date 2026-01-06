/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';

export function useInspectorPopoverPlacement(
	{ isControl } = { isControl: false }
) {
	const isMobile = useViewportMatch( 'medium', '<' );
	return ! isMobile
		? {
				popoverProps: {
					placement: 'left-start',
					// For non-mobile, inner sidebar width (248px) - button width (24px) - border (1px) + padding (16px) + spacing (20px)
					offset: isControl ? 35 : 259,
				},
		  }
		: {};
}
