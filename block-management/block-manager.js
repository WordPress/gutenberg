/**
 * @format
 * @flow
 */

import React from 'react';
import { StyleSheet, Text, View, FlatList, TextInput } from 'react-native';

export default class BlockManager extends React.Component<{}, { blocks: Array<string> }> {
	constructor( props: {} ) {
		super( props );
		this.state = {
			blocks: [
				'Johannes Gensfleisch zur Laden zum Gutenberg',
				'Born: ~1400',
				'Died: February 3, 1468 (aged about 68)',
				'Known for the invention of the movable-type printing press',
				"The world's first movable type printing press technology for printing paper books was made of porcelain materials and was invented around AD 1040 in China during the Northern Song Dynasty by the inventor Bi Sheng (990–1051).",
				'Around 1450, Johannes Gutenberg introduced the metal movable-type printing press in Europe, along with innovations in casting the type based on a matrix and hand mould.',
				'The small number of alphabetic characters needed for European languages was an important factor.[3] Gutenberg was the first to create his type pieces from an alloy of lead, tin, and antimony—and these materials remained standard for 550 years.',
				'The concept of inkjet printing originated in the 20th century, and the technology was first extensively developed in the early 1950s',
				'',
			],
		};
	}

	render() {
		return (
			<View style={ styles.container }>
				<View style={ { height: 30 } } />
				<FlatList
					style={ styles.list }
					data={ [
						{ key: 1 },
						{ key: 2 },
						{ key: 3 },
						{ key: 4 },
						{ key: 5 },
						{ key: 6 },
						{ key: 7 },
						{ key: 8 },
						{ key: 9 },
					] }
					renderItem={ this.renderItem.bind( this ) }
				/>
			</View>
		);
	}

	renderItem( value: { item: { key: number } } ) {
		var key = value.item.key;
		return (
			<TextInput
				style={ styles.listItem }
				multiline={ true }
				value={ this.state.blocks[ key ] }
				onChangeText={ content => {
					var blocks = this.state.blocks;
					blocks[ key ] = content;
					this.setState( { blocks: blocks } );
				} }
			/>
		);
	}
}

const styles = StyleSheet.create( {
	container: {
		flex: 1,
		backgroundColor: '#ccc',
	},
	list: {
		flex: 1,
		backgroundColor: '#ccc',
	},
	title: {
		backgroundColor: '#eee',
	},
	listItem: {
		marginTop: 10,
		padding: 20,
		backgroundColor: '#ddd',
	},
} );
