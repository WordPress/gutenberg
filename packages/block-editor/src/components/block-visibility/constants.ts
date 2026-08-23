import type { ReactElement } from 'react';
import { __ } from '@wordpress/i18n';
import { desktop, tablet, mobile } from '@wordpress/icons';

/**
 * The viewports for which block visibility can be controlled.
 */
export type BlockVisibilityViewport = 'desktop' | 'tablet' | 'mobile';

/**
 * The choices for the block visibility.
 *
 * Duplicated in packages/editor/src/components/preview-dropdown/index.js (choices
 * array), packages/edit-site/src/components/block-editor/viewport.js and
 * packages/boot/src/components/canvas/viewport.ts (VALID_VIEWPORTS). Update all
 * four when adding new viewport types.
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
} satisfies Record<
	BlockVisibilityViewport,
	{ label: string; icon: ReactElement; key: BlockVisibilityViewport }
>;

export const BLOCK_VISIBILITY_VIEWPORT_ENTRIES = Object.entries(
	BLOCK_VISIBILITY_VIEWPORTS
);
