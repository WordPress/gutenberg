/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

export default function useOverlay( currentOverlayId ) {
	return useSelect(
		( select ) => {
			const themeSlug = select( coreStore ).getCurrentTheme()?.stylesheet;

			const themeOverlay = themeSlug
				? select( coreStore ).getEntityRecord(
						'postType',
						'wp_template_part',
						`${ themeSlug }//navigation-overlay`
				  )
				: null;

			const customOverlay = themeSlug
				? select( coreStore ).getEntityRecord(
						'postType',
						'wp_template_part',
						currentOverlayId
				  )
				: null;

			return customOverlay || themeOverlay;
		},
		[ currentOverlayId ]
	);
}
