/**
* @format
* @flow
*/

import React from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import InlineToolbar from './inline-toolbar';

import type { BlockType } from '../store/';

import styles from './block-holder.scss';

// Gutenberg imports
import { BlockEdit } from '@wordpress/editor';

type PropsType = BlockType & {
	showTitle: boolean,
	onChange: ( clientId: string, attributes: mixed ) => void,
	onInlineToolbarButtonPressed: ( button: number, clientId: string ) => void,
	onBlockHolderPressed: ( clientId: string ) => void,
	insertBlocksAfter: ( blocks: Array<Object> ) => void,
	mergeBlocks: ( forward: boolean ) => void,
};

export default class BlockHolder extends React.Component<PropsType> {
	renderToolbarIfBlockFocused() {
		if ( this.props.focused ) {
			return (
				<InlineToolbar
					clientId={ this.props.clientId }
					onButtonPressed={ this.props.onInlineToolbarButtonPressed }
				/>
			);
		}

		// Return empty view, toolbar won't be rendered
		return <View />;
	}

	getBlockForType() {
		return (
			<BlockEdit
				name={ this.props.name }
				attributes={ { ...this.props.attributes } }
				// pass a curried version of onChanged with just one argument
				setAttributes={ ( attrs ) =>
					this.props.onChange( this.props.clientId, { ...this.props.attributes, ...attrs } )
				}
				insertBlocksAfter={ this.props.insertBlocksAfter }
				mergeBlocks={ this.props.mergeBlocks }
				isSelected={ this.props.focused }
			/>
		);
	}

	renderBlockTitle() {
		return (
			<View style={ styles.blockTitle }>
				<Text>BlockType: { this.props.name }</Text>
			</View>
		);
	}

	render() {
		return (
			<TouchableWithoutFeedback
				onPress={ this.props.onBlockHolderPressed.bind( this, this.props.clientId ) }
			>
				<View style={ styles.blockHolder }>
					{ this.props.showTitle && this.renderBlockTitle() }
					<View style={ styles.blockContainer }>{ this.getBlockForType.bind( this )() }</View>
					{ this.renderToolbarIfBlockFocused.bind( this )() }
				</View>
			</TouchableWithoutFeedback>
		);
	}
}
