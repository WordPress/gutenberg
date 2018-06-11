/**
 * Node dependencies
 */
const path = require( 'path' );

const root = path.resolve( __dirname, '../../../' );

module.exports = {
	namespaces: {
		core: {
			title: 'WordPress Core Data',
			// Figures out a way to generate docs for the dynamic actions/selectors
			selectors: [ path.resolve( root, 'packages/core-data/src/selectors.js' ) ],
			actions: [ path.resolve( root, 'packages/core-data/src/actions.js' ) ],
		},
		'core/blocks': {
			title: 'Block Types Data',
			selectors: [ path.resolve( root, 'blocks/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'blocks/store/actions.js' ) ],
		},
		'core/editor': {
			title: 'The Editor\'s Data',
			selectors: [ path.resolve( root, 'editor/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'editor/store/actions.js' ) ],
		},
		'core/edit-post': {
			title: 'The Editor\'s UI Data',
			selectors: [ path.resolve( root, 'edit-post/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'edit-post/store/actions.js' ) ],
		},
		'core/viewport': {
			title: 'The viewport module Data',
			selectors: [ path.resolve( root, 'viewport/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'viewport/store/actions.js' ) ],
		},
		'core/nux': {
			title: 'The NUX module Data',
			selectors: [ path.resolve( root, 'nux/store/selectors.js' ) ],
			actions: [ path.resolve( root, 'nux/store/actions.js' ) ],
		},
	},

	output: path.resolve( __dirname, '../' ),
};
