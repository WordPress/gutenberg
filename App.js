/** @format */

// @flow

import React from 'react';

import { registerCoreBlocks } from '@gutenberg/blocks/library';

import BlockManager from './block-management/block-manager';
import type { BlockArray } from './block-management/block-manager';

type Props = {};
type State = {
	blocks: BlockArray,
};

export default class App extends React.Component<Props, State> {
	constructor( props: Props ) {
		super( props );

		registerCoreBlocks();

		this.state = {
			// TODO: get blocks list block state should be externalized (shared with Gutenberg at some point?).
			// If not it should be created from a string parsing (commented HTML to json).
			blocks: [
				{
					key: '0',
					blockType: 'title',
					content: 'Hello World',
					focused: false,
				},
				{
					key: '1',
					blockType: 'paragraph',
					content:
						'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer tempor tincidunt sapien, quis dictum orci sollicitudin quis. Proin sed elit id est pulvinar feugiat vitae eget dolor. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
					focused: false,
				},
				{
					key: '2',
					blockType: 'paragraph',
					content:
						'書籍やウェブページや広告などのデザインのプロトタイプを制作したり顧客にプレゼンテーションしたりする際に、まだ正式な文章の出来上がっていないテキスト部分の書体（フォント）、タイポグラフィ、レイアウトなどといった視覚的なデザインを調整したりわかりやすく見せるために用いられる。',
					focused: false,
				},
				{
					key: '3',
					blockType: 'core/code',
					content: 'if name == "World":\n    return "Hello World"\nelse:\n    return "Hello Pony"',
					focused: false,
				},
				{
					key: '4',
					blockType: 'paragraph',
					content:
						'Лорем ипсум долор сит амет, адиписци трацтатос еа еум. Меа аудиам малуиссет те, хас меис либрис елеифенд ин. Нец ех тота деленит сусципит. Яуас порро инструцтиор но нец.',
					focused: false,
				},
			],
		};
	}

	render() {
		return <BlockManager blocks={ this.state.blocks } />;
	}
}
