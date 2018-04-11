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

Gutenberg by Front requires `window.wpApiSettings`, `window.wp`, `window._wpDateSettings`, `window.userSettings`, `window.jQuery`, `window.wpEditorL10n`

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
	rows: [
		{ cols: [ 6, 6 ], title: 'col6 x 2', description: __( '2 eq columns layout' ) },
		{ cols: [ 4, 4, 4 ], title: 'col4 x 3', description: __( '3 eq columns layout' ) }, 
	]
	panel: [ 'post-status', 'post-excerpt', 'post-taxonomies', 'featured-image', 'discussion-panel', 'last-revision', 'page-attributes', 'document-outline-panel', 'meta-boxes', 'panel-settings', 'articles-panel' ],
	editor: {
		hideTitle: true, // hide title field on editor
		noMediaLibrary: true // there is no Media Library
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
