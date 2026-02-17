/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { desktop, tablet, mobile } from '@wordpress/icons';

/**
 * The choices for the block visibility.
 *
 * Duplicated in packages/editor/src/components/preview-dropdown/index.js (choices array)
 * and packages/edit-site/src/components/block-editor/use-viewport-sync.js
 * (VALID_DEVICE_TYPES). Update all three when adding new viewport types.
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
