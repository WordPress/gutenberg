import { viewPort } from '@wordpress/utils';

export const STORE_DEFAULTS = {
	preferences: {
		mode: 'visual',
		isSidebarOpened: ! viewPort.isExtraSmall(),
		panels: { 'post-status': true },
		recentlyUsedBlocks: [],
		blockUsage: {},
		features: {
			fixedToolbar: true,
		},
	},
};
