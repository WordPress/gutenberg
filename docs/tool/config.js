/**
 * External dependencies
 */
const glob = require( 'glob' ).sync;
const path = require( 'path' );

const root = path.resolve( __dirname, '../../' );

module.exports = {
	componentPaths: glob( 'packages/components/src/*/**/README.md' ),
	dataNamespaces: {
		core: {
			title: 'WordPress Core Data',
			// TODO: Figure out a way to generate docs for dynamic actions/selectors
			selectors: [ path.resolve( root, 'packages/core-data/src/selectors.js' ) ],
			actions: [ path.resolve( root, 'packages/core-data/src/actions.js' ) ],
		},
		'core/annotations': {
			title: 'Annotations',
			selectors: [ path.resolve( root, 'packages/annotations/src/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'packages/annotations/src/store/actions.js' ) ],
		},
		'core/blocks': {
			title: 'Block Types Data',
			selectors: [ path.resolve( root, 'packages/blocks/src/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'packages/blocks/src/store/actions.js' ) ],
		},
		'core/block-editor': {
			title: 'The Block Editor’s Data',
			selectors: [ path.resolve( root, 'packages/block-editor/src/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'packages/block-editor/src/store/actions.js' ) ],
		},
		'core/editor': {
			title: 'The Post Editor’s Data',
			selectors: [ path.resolve( root, 'packages/editor/src/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'packages/editor/src/store/actions.js' ) ],
		},
		'core/edit-post': {
			title: 'The Editor’s UI Data',
			selectors: [ path.resolve( root, 'packages/edit-post/src/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'packages/edit-post/src/store/actions.js' ) ],
		},
		'core/notices': {
			title: 'Notices Data',
			selectors: [ path.resolve( root, 'packages/notices/src/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'packages/notices/src/store/actions.js' ) ],
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

	packageFileNames: glob( 'packages/*/package.json' )
		.map( ( fileName ) => fileName.split( '/' )[ 1 ] ),

	tocFileName: path.resolve( __dirname, '../toc.json' ),
	manifestOutput: path.resolve( __dirname, '../manifest.json' ),
};
