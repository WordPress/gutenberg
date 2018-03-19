/**
 * @format
 * @flow
 */

import React from 'react';
import { StyleSheet, Text, View, FlatList, TextInput } from 'react-native';
import BlockHolder from './block-holder';

export default class BlockManager extends React.Component<
	{},
	{ blocks: Array<{ key: string, blockType: string, content: string }> }
> {
	constructor( props: {} ) {
		super( props );
		// TODO: block state should be externalized (shared with Gutenberg at some point?).
		// If not it should be created from a string parsing (commented HTML to json).
		this.state = {
			blocks: [
				{
					key: '0',
					blockType: 'title',
					content: 'Hello World',
				},
				{
					key: '1',
					blockType: 'paragraph',
					content:
						'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer tempor tincidunt sapien, quis dictum orci sollicitudin quis. Proin sed elit id est pulvinar feugiat vitae eget dolor. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
				},
				{
					key: '2',
					blockType: 'paragraph',
					content:
						'書籍やウェブページや広告などのデザインのプロトタイプを制作したり顧客にプレゼンテーションしたりする際に、まだ正式な文章の出来上がっていないテキスト部分の書体（フォント）、タイポグラフィ、レイアウトなどといった視覚的なデザインを調整したりわかりやすく見せるために用いられる。',
				},
				{
					key: '3',
					blockType: 'code',
					content: 'if name == "World":\n    return "Hello World"\nelse:\n    return "Hello Pony"',
				},
				{
					key: '4',
					blockType: 'paragraph',
					content:
						'משפטים יוצרים חפש גם, בה אנא שתפו ספרדית אנגלשמות אם אחר. סרבול ספרות הבאים בדף גם, מה אתה ויקיפדיה האטמוספירה. אל בקר נפלו יכול. כלים ביולי וכמקובל רבה בה, בה התפת',
				},
			],
		};
	}

	render() {
		return (
			<View style={ styles.container }>
				<View style={ { height: 30 } } />
				<FlatList
					style={ styles.list }
					data={ this.state.blocks }
					renderItem={ this.renderItem.bind( this ) }
				/>
			</View>
		);
	}

	renderItem( value: {
		item: { key: string, blockType: string, content: string },
		index: number,
	} ) {
		return <BlockHolder index={ value.index } { ...value.item } />;
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
