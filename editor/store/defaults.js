export const PREFERENCES_DEFAULTS = {
	editorMode: 'visual',
	viewMode: 'desktop', // 'desktop' | 'mobile'
	activeGeneralSidebar: null, // null | 'editor' | 'plugins'
	activeSidebarPanel: { // The keys in this object should match activeSidebarPanel values
		editor: null, // 'document' | 'block'
		plugins: null, // pluginId
	},
	panels: { 'post-status': true },
	recentlyUsedBlocks: [],
	blockUsage: {},
	features: {
		fixedToolbar: false,
	},
};
