/**
 * Internal dependencies
 */
import convertPreferencesPackageData from '../';

const input = {
	'core/customize-widgets': {
		welcomeGuide: false,
		fixedToolbar: true,
	},
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
		preferredStyleVariations: {
			'core/quote': 'large',
		},
		inactivePanels: [],
		openPanels: [ 'post-status' ],
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
};

describe( 'convertPreferencesPackageData', () => {
	it( 'converts data to the expected format', () => {
		expect( convertPreferencesPackageData( input ) )
			.toMatchInlineSnapshot( `
		{
		  "core/customize-widgets": {
		    "fixedToolbar": true,
		    "welcomeGuide": false,
		  },
		  "core/edit-post": {
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
		    "preferredStyleVariations": {
		      "core/quote": "large",
		    },
		    "welcomeGuide": false,
		  },
		  "core/edit-site": {
		    "fixedToolbar": true,
		    "isComplementaryAreaVisible": true,
		    "welcomeGuide": false,
		    "welcomeGuideStyles": false,
		  },
		  "core/edit-widgets": {
		    "fixedToolbar": true,
		    "isComplementaryAreaVisible": true,
		    "showBlockBreadcrumbs": false,
		    "welcomeGuide": false,
		  },
		}
	` );
	} );
} );
