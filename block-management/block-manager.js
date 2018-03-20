/**
 * @format
 * @flow
 */

import React from 'react';
import { StyleSheet, Text, View, FlatList, TextInput } from 'react-native';
import BlockHolder from './block-holder';
import { ToolbarButton } from './constants';

export default class BlockManager extends React.Component<
	{},
	{
		refresh: boolean,
		blocks: Array<{ key: string, blockType: string, content: string, focused: boolean }>,
	}
> {
	constructor( props: {} ) {
		super( props );
		// TODO: block state should be externalized (shared with Gutenberg at some point?).
		// If not it should be created from a string parsing (commented HTML to json).
		this.state = {
			refresh: false,
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
					blockType: 'code',
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

	onBlockHolderPressed( rowId: number ) {
		var blocks = this.state.blocks;
		const currentBlockState = blocks[ rowId ].focused;
		// Deselect all blocks
		for ( let block of blocks ) {
			block.focused = false;
		}
		// Select or deselect pressed block
		blocks[ rowId ].focused = ! currentBlockState;
		this.setState( { blocks: blocks, refresh: ! this.state.refresh } );
	}

	onToolbarButtonPressed( button: number, index: number ) {
		var blocks = this.state.blocks;
		switch ( button ) {
			case ToolbarButton.UP:
				if ( index == 0 ) return;
				var tmp = blocks[ index ];
				blocks[ index ] = blocks[ index - 1 ];
				blocks[ index - 1 ] = tmp;
				break;
			case ToolbarButton.DOWN:
				if ( index == blocks.length - 1 ) return;
				var tmp = blocks[ index ];
				blocks[ index ] = blocks[ index + 1 ];
				blocks[ index + 1 ] = tmp;
				break;
			case ToolbarButton.DELETE:
				blocks.splice( index, 1 );
				break;
			case ToolbarButton.SETTINGS:
				// TODO: implement settings
				break;
		}
		this.setState( { blocks: blocks, refresh: ! this.state.refresh } );
	}

	render() {
		return (
			<View style={ styles.container }>
				<View style={ { height: 30 } } />
				<FlatList
					style={ styles.list }
					data={ this.state.blocks }
					extraData={ this.state.refresh }
					renderItem={ this.renderItem.bind( this ) }
				/>
			</View>
		);
	}

	renderItem( value: {
		item: { key: string, blockType: string, content: string, focused: boolean },
		index: number,
	} ) {
		return (
			<BlockHolder
				onToolbarButtonPressed={ this.onToolbarButtonPressed.bind( this ) }
				onBlockHolderPressed={ this.onBlockHolderPressed.bind( this ) }
				focused={ value.item.focused }
				index={ value.index }
				{ ...value.item }
			/>
		);
	}
}

const styles = StyleSheet.create( {
	container: {
		flex: 1,
		backgroundColor: '#caa',
	},
	list: {
		flex: 1,
		backgroundColor: '#ccc',
	},
} );
