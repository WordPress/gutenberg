export const STORE_DEFAULTS = {
	preferences: {
		mode: 'visual',
		isSidebarOpened: window.innerWidth >= 782,
		isExtendedSettingsOpened: window.innerWidth >= 782,
		panels: { 'post-status': true },
		recentlyUsedBlocks: [],
		blockUsage: {},
	},
};
