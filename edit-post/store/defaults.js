export const PREFERENCES_DEFAULTS = {
	editorMode: 'visual',
	activeGeneralSidebar: 'editor', // null | 'editor' | 'plugin'
	activeSidebarPanel: { // The keys in this object should match activeSidebarPanel values
		editor: null, // 'document' | 'block'
		plugin: null, // pluginId
	},
	panels: { 'post-status': true },
	features: {
		fixedToolbar: false,
	},
};
