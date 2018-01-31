export const PREFERENCES_DEFAULTS = {
	editorMode: 'visual',
	viewportType: 'desktop', // 'desktop' | 'mobile'
	activeGeneralSidebar: null, // null | 'editor' | 'plugins'
	activeSidebarPanel: { // The keys in this object should match activeSidebarPanel values
		editor: null, // 'document' | 'block'
		plugins: null, // pluginId
	},
	panels: { 'post-status': true },
	features: {
		fixedToolbar: false,
	},
};
