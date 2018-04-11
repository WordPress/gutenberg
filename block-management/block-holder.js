/**
 * @format
 * @flow
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import Toolbar from './toolbar';

import type { BlockType } from '../store/';

// Gutenberg imports
import { getBlockType } from '@gutenberg/blocks/api';

type PropsType = BlockType & {
	onChange: ( uid: string, attributes: mixed ) => void,
	onToolbarButtonPressed: ( button: number, uid: string ) => void,
	onBlockHolderPressed: ( uid: string ) => void,
};
type StateType = { selected: boolean, focused: boolean };

export default class BlockHolder extends React.Component<PropsType, StateType> {
	renderToolbarIfBlockFocused() {
		if ( this.props.focused ) {
			return (
				<Toolbar uid={ this.props.uid } onButtonPressed={ this.props.onToolbarButtonPressed } />
			);
		}

		// Return empty view, toolbar won't be rendered
		return <View />;
	}

	getBlockForType() {
		const blockType = getBlockType( this.props.name );
		if ( blockType ) {
			const Block = blockType.edit;

			// TODO: setAttributes needs to change the state/attributes
			return (
				<Block
					attributes={ { ...this.props.attributes } }
					// pass a curried version of onChanged with just one argument
					setAttributes={ attrs => this.props.onChange( this.props.uid, attrs ) }
				/>
			);
		}

		// Default block placeholder
		return <Text>{ this.props.attributes.content }</Text>;
	}

	render() {
		return (
			<TouchableWithoutFeedback
				onPress={ this.props.onBlockHolderPressed.bind( this, this.props.uid ) }
			>
				<View style={ styles.blockHolder }>
					<View style={ styles.blockTitle }>
						<Text>BlockType: { this.props.name }</Text>
					</View>
					<View style={ styles.blockContainer }>{ this.getBlockForType.bind( this )() }</View>
					{ this.renderToolbarIfBlockFocused.bind( this )() }
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

const styles = StyleSheet.create( {
	blockHolder: {
		flex: 1,
	},
	blockContainer: {
		backgroundColor: 'white',
	},
	blockContent: {
		padding: 10,
	},
	blockTitle: {
		backgroundColor: 'grey',
		paddingLeft: 10,
		paddingTop: 4,
		paddingBottom: 4,
	},
} );
