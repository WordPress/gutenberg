/**
 * @format
 * @flow
 */

// Gutenberg imports
import { registerCoreBlocks } from '@gutenberg/core-blocks';
import { createBlock } from '@gutenberg/blocks';

import { createStore } from 'redux';
import { reducer } from './reducers';

export type BlockType = {
	uid: string,
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

const codeBlockInstance = createBlock( 'core/code', {
	content: 'if name == "World":\n    return "Hello World"\nelse:\n    return "Hello Pony"',
} );

const moreBlockInstance = createBlock( 'core/more', {
	customText: undefined,
} );

const initialState: StateType = {
	// TODO: get blocks list block state should be externalized (shared with Gutenberg at some point?).
	// If not it should be created from a string parsing (commented HTML to json).
	blocks: [
		{
			uid: '0',
			name: 'title',
			isValid: true,
			attributes: {
				content: 'Hello World',
			},
			innerBlocks: [],
			focused: false,
		},
		{
			uid: '1',
			name: 'paragraph',
			isValid: true,
			attributes: {
				content:
					'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer tempor tincidunt sapien, quis dictum orci sollicitudin quis. Proin sed elit id est pulvinar feugiat vitae eget dolor. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
			},
			innerBlocks: [],
			focused: false,
		},
		{
			uid: '2',
			name: 'paragraph',
			isValid: true,
			attributes: {
				content:
					'書籍やウェブページや広告などのデザインのプロトタイプを制作したり顧客にプレゼンテーションしたりする際に、まだ正式な文章の出来上がっていないテキスト部分の書体（フォント）、タイポグラフィ、レイアウトなどといった視覚的なデザインを調整したりわかりやすく見せるために用いられる。',
			},
			innerBlocks: [],
			focused: false,
		},
		{ ...codeBlockInstance, focused: false },
		{ ...moreBlockInstance, focused: false },
		{
			uid: '4',
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
	( 'development' === process.env.NODE_ENV && require( 'remote-redux-devtools' ).default ) ||
	( () => {} );

export function setupStore( state: StateType = initialState ) {
	const store = createStore( reducer, state, devToolsEnhancer() );
	return store;
}
