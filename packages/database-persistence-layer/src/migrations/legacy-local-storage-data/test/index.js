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
			preferredStyleVariations: { 'core/quote': 'plain' },
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

describe( 'convertLegacyData', () => {
	it( 'converts to the expected format', () => {
		expect( convertLegacyData( legacyData ) ).toMatchInlineSnapshot( `
		Object {
		  "preferences": Object {
		    "core/customize-widgets": Object {
		      "fixedToolbar": true,
		      "keepCaretInsideBlock": true,
		      "welcomeGuide": false,
		    },
		    "core/edit-post": Object {
		      "complementaryArea": "edit-post/document",
		      "editorMode": "text",
		      "fixedToolbar": true,
		      "hiddenBlockTypes": Array [
		        "core/heading",
		        "core/list",
		      ],
		      "inactivePanels": Array [
		        "post-excerpt",
		      ],
		      "openPanels": Array [
		        "post-status",
		        "taxonomy-panel-category",
		      ],
		      "pinnedItems": Object {
		        "my-sidebar-plugin/title-sidebar": false,
		      },
		      "preferredStyleVariations": Object {
		        "core/quote": "plain",
		      },
		      "welcomeGuide": false,
		    },
		    "core/edit-site": Object {
		      "complementaryArea": "edit-site/global-styles",
		      "fixedToolbar": true,
		      "focusMode": true,
		      "welcomeGuide": false,
		      "welcomeGuideStyles": false,
		    },
		    "core/edit-widgets": Object {
		      "complementaryArea": "edit-widgets/block-areas",
		      "fixedToolbar": true,
		      "keepCaretInsideBlock": true,
		      "welcomeGuide": false,
		    },
		    "third-party-plugin": Object {
		      "thirdPartyFeature": true,
		    },
		  },
		}
	` );
	} );
} );
