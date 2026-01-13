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
		key: 'desktop',
	},
	tablet: {
		label: __( 'Tablet' ),
		icon: tablet,
		key: 'tablet',
	},
	mobile: {
		label: __( 'Mobile' ),
		icon: mobile,
		key: 'mobile',
	},
};

export const BLOCK_VISIBILITY_VIEWPORT_ENTRIES = Object.entries(
	BLOCK_VISIBILITY_VIEWPORTS
);
