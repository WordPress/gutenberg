/**
 * @format
 * @flow
 */

// Gutenberg imports
import { registerCoreBlocks } from '@wordpress/block-library';
import { parse } from '@wordpress/blocks';

import { createStore } from 'redux';
import { reducer } from './reducers';

export type BlockType = {
	clientId: string,
	name: string,
	isValid: boolean,
	attributes: Object,
	innerBlocks: Array<BlockType>,
	focused: boolean,
};

export type StateType = {
	blocks: Array<BlockType>,
	refresh: boolean,
};

registerCoreBlocks();

const initialCodeBlockHtml = `
<!-- wp:code -->
<pre class="wp-block-code"><code>if name == "World":
    return "Hello World"
else:
    return "Hello Pony"</code></pre>
<!-- /wp:code -->
`;

const initialMoreBlockHtml = `
<!-- wp:more -->
<!--more-->
<!-- /wp:more -->
`;

const initialHeadingBlockHtml =
	'<!-- wp:heading {"level": 2} --><h2>Welcome to Gutenberg</h2><!-- /wp:heading -->';
const initialParagraphBlockHtml =
	'<!-- wp:paragraph --><p><b>Hello</b> World!</p><!-- /wp:paragraph -->';
const initialParagraphBlockHtml2 = `<!-- wp:paragraph {"dropCap":true,"backgroundColor":"vivid-red","fontSize":"large","className":"custom-class-1 custom-class-2"} -->
<p class="has-background has-drop-cap has-large-font-size has-vivid-red-background-color custom-class-1 custom-class-2">
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer tempor tincidunt sapien, quis dictum orci sollicitudin quis. Proin sed elit id est pulvinar feugiat vitae eget dolor. Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p><!-- /wp:paragraph -->`;

const codeBlockInstance = parse( initialCodeBlockHtml )[ 0 ];
const moreBlockInstance = parse( initialMoreBlockHtml )[ 0 ];
const headingBlockInstance = parse( initialHeadingBlockHtml )[ 0 ];
const paragraphBlockInstance = parse( initialParagraphBlockHtml )[ 0 ];
const paragraphBlockInstance2 = parse( initialParagraphBlockHtml2 )[ 0 ];

const initialState: StateType = {
	// TODO: get blocks list block state should be externalized (shared with Gutenberg at some point?).
	// If not it should be created from a string parsing (commented HTML to json).
	blocks: [
		{
			clientId: '1',
			name: 'title',
			isValid: true,
			attributes: {
				content: 'Hello World',
			},
			innerBlocks: [],
			focused: false,
		},
		{ ...headingBlockInstance, focused: false },
		{ ...paragraphBlockInstance, focused: false },
		{ ...paragraphBlockInstance2, focused: false },
		{ ...codeBlockInstance, focused: false },
		{ ...moreBlockInstance, focused: false },
		{
			clientId: '5',
			name: 'paragraph',
			isValid: true,
			attributes: {
				content:
					'Лорем ипсум долор сит амет, адиписци трацтатос еа еум. Меа аудиам малуиссет те, хас меис либрис елеифенд ин. Нец ех тота деленит сусципит. Яуас порро инструцтиор но нец.',
			},
			innerBlocks: [],
			focused: false,
		},
	],
	refresh: false,
};

const devToolsEnhancer =
	// ( 'development' === process.env.NODE_ENV && require( 'remote-redux-devtools' ).default ) ||
	() => {};

export function setupStore( state: StateType = initialState ) {
	const store = createStore( reducer, state, devToolsEnhancer() );
	return store;
}
