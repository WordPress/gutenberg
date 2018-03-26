/**
 * @format
 * @flow
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import Toolbar from './toolbar';

// Gutenberg imports
import { getBlockType } from '@gutenberg/blocks/api';

type PropsType = {
	uid: string,
	blockType: string,
	attributes: { content: mixed },
	focused: boolean,
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
		} else {
			// Return empty view, toolbar won't be rendered
			return <View />;
		}
	}

	getBlockForType() {
		const blockType = getBlockType( this.props.blockType );
		if ( blockType ) {
			const Code = blockType.edit;
			// TODO: input text needs to be kept by updating the attributes
			return (
				<Code
					attributes={ { ...this.props.attributes } }
					// pass a curried version of onChanged with just one argument
					setAttributes={ attrs => this.props.onChange( this.props.uid, attrs ) }
				/>
			);
		} else {
			// Default block placeholder
			return <Text>{ this.props.attributes.content }</Text>;
		}
	}

	render() {
		return (
			<TouchableWithoutFeedback
				onPress={ this.props.onBlockHolderPressed.bind( this, this.props.uid ) }
			>
				<View style={ styles.blockHolder }>
					<View style={ styles.blockTitle }>
						<Text>BlockType: { this.props.blockType }</Text>
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
