/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { desktop, tablet, mobile } from '@wordpress/icons';

/**
 * The choices for the block visibility.
 * Must match those in packages/editor/src/components/preview-dropdown/index.js.
 *
 * @todo create a single source of truth for the viewport types.
 */
export const BLOCK_VISIBILITY_VIEWPORTS = {
	desktop: {
		label: __( 'Desktop' ),
		icon: desktop,
		value: 'desktop',
	},
	tablet: {
		label: __( 'Tablet' ),
		icon: tablet,
		value: 'tablet',
	},
	mobile: {
		label: __( 'Mobile' ),
		icon: mobile,
		value: 'mobile',
	},
};
