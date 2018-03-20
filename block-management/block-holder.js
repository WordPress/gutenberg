/**
 * @format
 * @flow
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import Toolbar from './toolbar';

// Gutenberg imports
import { settings as codeBlock } from '../gutenberg/blocks/library/code';

type PropsType = {
	index: number,
	blockType: string,
	content: string,
	focused: boolean,
	onToolbarButtonPressed: ( button: number, index: number ) => void,
	onBlockHolderPressed: ( rowId: number ) => void,
};
type StateType = { selected: boolean, focused: boolean };

export default class BlockHolder extends React.Component<PropsType, StateType> {
	renderToolbarIfBlockFocused() {
		if ( this.props.focused ) {
			return (
				<Toolbar index={ this.props.index } onButtonPressed={ this.props.onToolbarButtonPressed } />
			);
		} else {
			// Return empty view, toolbar won't be rendered
			return <View />;
		}
	}

	render() {
		// TODO: This is a place holder, this should call the edit() method of the block depending on this.props.blockType
		if ( this.props.blockType === 'code' ) {
			const Code = codeBlock.edit;
			return (
				<TouchableWithoutFeedback
					onPress={ this.props.onBlockHolderPressed.bind( this, this.props.index ) }
				>
					<View style={ styles.blockHolder }>
						<View style={ styles.blockTitle }>
							<Text>BlockType: { this.props.blockType }</Text>
						</View>
						<Code
							attributes={ { content: this.props.content } }
							// TODO: input text needs to be kept by updating the attributes
							setAttributes={ attrs => console.log( { attrs } ) }
						/>
						{ this.renderToolbarIfBlockFocused.bind( this )() }
					</View>
				</TouchableWithoutFeedback>
			);
		}

		return (
			<TouchableWithoutFeedback
				onPress={ this.props.onBlockHolderPressed.bind( this, this.props.index ) }
			>
				<View style={ styles.blockHolder }>
					<View style={ styles.blockTitle }>
						<Text>BlockType: { this.props.blockType }</Text>
					</View>
					<View style={ styles.blockContent }>
						<Text>{ this.props.content }</Text>
					</View>
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
	blockContent: {
		backgroundColor: 'white',
		padding: 10,
	},
	blockTitle: {
		backgroundColor: 'grey',
		paddingLeft: 10,
		paddingTop: 4,
		paddingBottom: 4,
	},
} );
