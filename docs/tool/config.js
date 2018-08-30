/**
 * External dependencies
 */
const glob = require( 'glob' ).sync;
const path = require( 'path' );

const root = path.resolve( __dirname, '../../' );

module.exports = {
	componentPaths: glob( 'packages/components/src/*/README.md' ),
	dataNamespaces: {
		core: {
			title: 'WordPress Core Data',
			// TODO: Figure out a way to generate docs for dynamic actions/selectors
			selectors: [ path.resolve( root, 'packages/core-data/src/selectors.js' ) ],
			actions: [ path.resolve( root, 'packages/core-data/src/actions.js' ) ],
		},
		'core/blocks': {
			title: 'Block Types Data',
			selectors: [ path.resolve( root, 'packages/blocks/src/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'packages/blocks/src/store/actions.js' ) ],
		},
		'core/editor': {
			title: 'The Editor’s Data',
			selectors: [ path.resolve( root, 'packages/editor/src/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'packages/editor/src/store/actions.js' ) ],
		},
		'core/edit-post': {
			title: 'The Editor’s UI Data',
			selectors: [ path.resolve( root, 'edit-post/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'edit-post/store/actions.js' ) ],
		},
		'core/nux': {
			title: 'The NUX (New User Experience) Data',
			selectors: [ path.resolve( root, 'packages/nux/src/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'packages/nux/src/store/actions.js' ) ],
		},
		'core/viewport': {
			title: 'The Viewport Data',
			selectors: [ path.resolve( root, 'packages/viewport/src/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'packages/viewport/src/store/actions.js' ) ],
		},
	},
	dataDocsOutput: path.resolve( __dirname, '../data' ),
	packages: glob( 'packages/*/README.md' ),
	rootManifest: path.resolve( __dirname, '../root-manifest.json' ),
	manifestOutput: path.resolve( __dirname, '../manifest.json' ),
};
