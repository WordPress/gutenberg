/** @format */

// @flow

import React from 'react';
import { StyleSheet, Text, View, FlatList, TextInput } from 'react-native';

export default class BlockManager extends React.Component {
	constructor( props ) {
		super( props );
		this.state = {
			1: 'Johannes Gensfleisch zur Laden zum Gutenberg',
			2: 'Born: ~1400',
			3: 'Died: February 3, 1468 (aged about 68)',
			4: 'Known for the invention of the movable-type printing press',
			5: "The world's first movable type printing press technology for printing paper books was made of porcelain materials and was invented around AD 1040 in China during the Northern Song Dynasty by the inventor Bi Sheng (990–1051).",
			6: 'Around 1450, Johannes Gutenberg introduced the metal movable-type printing press in Europe, along with innovations in casting the type based on a matrix and hand mould.',
			7: 'The small number of alphabetic characters needed for European languages was an important factor.[3] Gutenberg was the first to create his type pieces from an alloy of lead, tin, and antimony—and these materials remained standard for 550 years.',
			8: 'The concept of inkjet printing originated in the 20th century, and the technology was first extensively developed in the early 1950s',
			9: '',
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

	renderItem( value ) {
		var key = value.item.key;
		return (
			<TextInput
				style={ styles.listItem }
				multiline={ true }
				value={ this.state[ key ] }
				onChangeText={ content => this.setState( { [ `${ key }` ]: content } ) }
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
