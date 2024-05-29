/**
 * Internal dependencies
 */
import { convertLegacyData } from '..';

const legacyData = {
	'core/interface': {
		enableItems: {
			singleEnableItems: {
				complementaryArea: {
					'core/edit-post': 'edit-post/document',
					'core/edit-site': 'edit-site/global-styles',
					'core/edit-widgets': 'edit-widgets/block-areas',
				},
			},
			multipleEnableItems: {
				pinnedItems: {
					'core/edit-post': {
						'my-sidebar-plugin/title-sidebar': false,
					},
				},
			},
		},
		preferences: {
			features: {
				'core/edit-post': { welcomeGuide: false, fixedToolbar: true },
				'core/edit-widgets': {
					welcomeGuide: false,
					fixedToolbar: true,
					keepCaretInsideBlock: true,
				},
				'core/customize-widgets': {
					welcomeGuide: false,
					fixedToolbar: true,
					keepCaretInsideBlock: true,
				},
				'third-party-plugin': {
					thirdPartyFeature: true,
				},
			},
		},
	},
	'core/edit-post': {
		preferences: {
			panels: {
				'post-status': { opened: true },
				'post-excerpt': { enabled: false },
				'taxonomy-panel-category': { opened: true },
			},
			editorMode: 'text',
			hiddenBlockTypes: [ 'core/heading', 'core/list' ],
			localAutosaveInterval: 15,
		},
	},
	'core/edit-site': {
		preferences: {
			features: {
				welcomeGuide: false,
				welcomeGuideStyles: false,
				fixedToolbar: true,
				focusMode: true,
			},
		},
	},
};

const alreadyConvertedData = {
	'core/block-editor': {
		preferences: {
			insertUsage: {
				'core/paragraph': {
					time: 1649320988011,
					count: 2,
					insert: {
						name: 'core/paragraph',
					},
				},
				'core/quote': {
					time: 1649320934860,
					count: 1,
					insert: {
						name: 'core/quote',
					},
				},
				'core/image': {
					time: 1649321017053,
					count: 1,
					insert: {
						name: 'core/image',
					},
				},
				'core/group': {
					time: 1649321017077,
					count: 1,
					insert: {
						name: 'core/group',
					},
				},
			},
		},
	},
	'core/preferences': {
		preferences: {
			'core/edit-widgets': {
				welcomeGuide: false,
				fixedToolbar: true,
				showBlockBreadcrumbs: false,
				complementaryArea: 'edit-widgets/block-areas',
			},
			'core/edit-post': {
				welcomeGuide: false,
				fixedToolbar: true,
				fullscreenMode: false,
				hiddenBlockTypes: [ 'core/audio', 'core/cover' ],
				editorMode: 'visual',
				inactivePanels: [],
				openPanels: [ 'post-status' ],
				complementaryArea: 'edit-post/block',
				pinnedItems: {
					'my-sidebar-plugin/title-sidebar': false,
				},
			},
			'core/edit-site': {
				welcomeGuide: false,
				welcomeGuideStyles: false,
				fixedToolbar: true,
				complementaryArea: 'edit-site/global-styles',
			},
		},
	},
};

describe( 'convertLegacyData', () => {
	it( 'converts to the expected format', () => {
		expect( convertLegacyData( legacyData ) ).toMatchInlineSnapshot( `
		{
		  "core/customize-widgets": {
		    "fixedToolbar": true,
		    "keepCaretInsideBlock": true,
		    "welcomeGuide": false,
		  },
		  "core/edit-post": {
		    "complementaryArea": "edit-post/document",
		    "editorMode": "text",
		    "fixedToolbar": true,
		    "hiddenBlockTypes": [
		      "core/heading",
		      "core/list",
		    ],
		    "inactivePanels": [
		      "post-excerpt",
		    ],
		    "openPanels": [
		      "post-status",
		      "taxonomy-panel-category",
		    ],
		    "pinnedItems": {
		      "my-sidebar-plugin/title-sidebar": false,
		    },
		    "welcomeGuide": false,
		  },
		  "core/edit-site": {
		    "complementaryArea": "edit-site/global-styles",
		    "fixedToolbar": true,
		    "focusMode": true,
		    "welcomeGuide": false,
		    "welcomeGuideStyles": false,
		  },
		  "core/edit-widgets": {
		    "complementaryArea": "edit-widgets/block-areas",
		    "fixedToolbar": true,
		    "keepCaretInsideBlock": true,
		    "welcomeGuide": false,
		  },
		  "third-party-plugin": {
		    "thirdPartyFeature": true,
		  },
		}
	` );
	} );

	it( 'retains already converted data', () => {
		expect( convertLegacyData( alreadyConvertedData ) )
			.toMatchInlineSnapshot( `
		{
		  "core/edit-post": {
		    "complementaryArea": "edit-post/block",
		    "editorMode": "visual",
		    "fixedToolbar": true,
		    "fullscreenMode": false,
		    "hiddenBlockTypes": [
		      "core/audio",
		      "core/cover",
		    ],
		    "inactivePanels": [],
		    "openPanels": [
		      "post-status",
		    ],
		    "pinnedItems": {
		      "my-sidebar-plugin/title-sidebar": false,
		    },
		    "welcomeGuide": false,
		  },
		  "core/edit-site": {
		    "complementaryArea": "edit-site/global-styles",
		    "fixedToolbar": true,
		    "welcomeGuide": false,
		    "welcomeGuideStyles": false,
		  },
		  "core/edit-widgets": {
		    "complementaryArea": "edit-widgets/block-areas",
		    "fixedToolbar": true,
		    "showBlockBreadcrumbs": false,
		    "welcomeGuide": false,
		  },
		}
	` );
	} );
} );
