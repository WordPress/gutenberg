/**
 * WordPress dependencies
 */
import { viewPort } from '@wordpress/utils';

export const PREFERENCES_DEFAULTS = {
	mode: 'visual',
	isSidebarOpened: ! viewPort.isExtraSmall(),
	panels: { 'post-status': true },
	recentlyUsedBlocks: [],
	features: {
		fixedToolbar: true,
	},
};
