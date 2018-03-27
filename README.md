# Gutenberg by Front

Gutenberg by Front could be used as a package of your project. 

Add `"gutenberg": "git://github.com/front/gutenberg.git"` to your `package.json` dependences.

## Usage

Example
```
import React from 'react';
import { initializeEditor } from 'gutenberg';

class GutenbergEditor extends React.Component {
	componentDidMount() {
		initializeEditor("editor", this.props.post, this.props.settings);
	}

	render() {
		return (
			<div className="gutenberg">
				<div id="editor" className="gutenberg__editor"></div>
			</div>
		);
	}
}

export default GutenbergEditor;
```

Don't forget to register the blocks
```
import { registerCoreBlocks } from 'gutenberg';

registerCoreBlocks();
```

Gutenberg by requires `window.wpApiSettings`, `window.wp`, `window._wpDateSettings`, `window.userSettings`, `window.jQuery`, `window.wpEditorL10n`

### Webpack setup

Webpack configuration should be similar to original Gutenberg.

```
...
// Main CSS loader for everything but blocks..
const mainCSSExtractTextPlugin = new ExtractTextPlugin( {
	filename: './build/style.css',
} );

// CSS loader for styles specific to block editing.
const editBlocksCSSPlugin = new ExtractTextPlugin( {
	filename: './blocks/build/edit-blocks.css',
} );

// CSS loader for styles specific to blocks in general.
const blocksCSSPlugin = new ExtractTextPlugin( {
	filename: './blocks/build/style.css',
} );

// Configuration for the ExtractTextPlugin.
const extractConfig = {
	use: [
		{ loader: 'raw-loader' },
		{
			loader: 'postcss-loader',
			options: {
				plugins: [
					require( 'autoprefixer' ),
				],
			},
		},
		{
			loader: 'sass-loader',
			query: {
				includePaths: [ 'node_modules/gutenberg/edit-post/assets/stylesheets' ],
				data: '@import "colors"; @import "admin-schemes"; @import "breakpoints"; @import "variables"; @import "mixins"; @import "animations";@import "z-index";',
				outputStyle: 'production' === process.env.NODE_ENV ? 'compressed' : 'nested',
			},
		},
	],
};

const gutenbergDependencies = [
	'blocks',
	'components',
	'date',
	'editor',
	'element',
	'i18n',
	'utils',
	'data',
	'viewport',
	'core-data',
	'plugins',
	'edit-post',
 	'url',
];

const alias = {};

gutenbergDependencies.forEach(dependency => {
 	alias["@wordpress/" + dependency] = `${paths.appNodeModules}/gutenberg/${dependency}`;
});
...
rules: [
	{
		test: /\.pegjs/,
		use: 'pegjs-loader',
	},
	{
		test: /\.js$/,
		exclude: /node_modules\/(?!(gutenberg)\/).*/,
		use: "babel-loader"
	},
	{
		test: /\.css$/,
		use: [
			{ loader: 'style-loader' }, 
			{ loader: 'css-loader' }
		]
	},
	{
		test: /style\.scss$/,
		include: [
			/blocks/,
		],
		use: blocksCSSPlugin.extract( extractConfig ),
	},
	{
		test: /editor\.scss$/,
		include: [
			/blocks/,
		],
		use: editBlocksCSSPlugin.extract( extractConfig ),
	},
	{
		test: /\.scss$/,
		exclude: [
			/blocks/,
		],
		use: mainCSSExtractTextPlugin.extract( extractConfig ),
	},
]
...
plugins: [
	blocksCSSPlugin,
    editBlocksCSSPlugin,
    mainCSSExtractTextPlugin,
    new CopyWebpackPlugin([
		{ from: 'node_modules/tinymce/plugins', to: `${distPath.js}plugins` }
    ], {}) 
]
...
```

## Custom Gutenberg

How all changes come from our needs, we decided to add a new object with a range of settings that make Gutenberg more customizable.  

```
cons customGutenberg = {
	categories: [ 
		{ slug: 'common', title: 'Common blocks' } // this category should allways be included
	],
	tabs: [
		{
			options: { name: 'blocks', title: 'Blocks', className: 'editor-inserter__tab' },
			tabScrollTop: 0, //
			getItemsForTab() { // if not set, frecentItems will be called
				return ( item ) => item.category !== 'embed' && item.category !== 'shared';
			},
			sortItems(items, state) { // if not set, items will be sort by category
				return items; // to render 
			},
			renderTabView(items) { // if not set, tabs will show items by category
				return items; // to render items without category headers
			}
		}
	],
	panel: [ 'post-status', 'post-excerpt', 'post-taxonomies', 'featured-image', 'discussion-panel', 'last-revision', 'page-attributes', 'document-outline-panel', 'meta-boxes', 'panel-settings', 'posts-list' ],
	editor: {
		hideTitle: true, // hide title field on editor
	}
};
```

# Blocks
## Article
Article contains a cover image and a title

## Row 6col - 6col
A row with 2 columns with the same width

## Row 4col - 4col - 4col
A row with 3 columns with the same width
