/**
 * @format
 * @flow
 */

import React from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import RCTAztecView from 'react-native-aztec';
import * as unsupportedBlock from '../block-types/unsupported-block.js';
import Toolbar from './toolbar';

import type { BlockType } from '../store/';

import styles from './block-holder.scss';

// Gutenberg imports
import { getBlockType } from '@wordpress/blocks';
import { getUnknownTypeHandlerName } from '@wordpress/blocks';

type PropsType = BlockType & {
	onChange: ( uid: string, attributes: mixed ) => void,
	onToolbarButtonPressed: ( button: number, uid: string ) => void,
	onBlockHolderPressed: ( uid: string ) => void,
};

type StateType = {
	selected: boolean,
	focused: boolean,
};

export default class BlockHolder extends React.Component<PropsType, StateType> {
	constructor( props: PropsType ) {
		super( props );
		this.state = {
			selected: false,
			focused: false,
		};
	}

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
		const blockType = this.getBlockType( this.props.name );
		const Block = blockType.edit;

		let style;
		if ( blockType.name === 'core/code' ) {
			style = styles.block_code;
		} else if ( blockType.name === 'core/paragraph' ) {
			style = styles[ 'aztec_editor' ];
		}

		// TODO: setAttributes needs to change the state/attributes
		return (
			<Block
				attributes={ { ...this.props.attributes } }
				// pass a curried version of onChanged with just one argument
				setAttributes={ ( attrs ) => this.props.onChange( this.props.uid, { ...this.props.attributes, ...attrs } ) }
				isSelected={ this.props.focused }
				style={ style }
			/>
		);

		return this.getBlockForUnsupportedType();
	}

	getBlockType( blockName ) {
		var blockType = getBlockType( blockName );

		if ( !blockType ) {
			const fallbackBlockName = getUnknownTypeHandlerName();
			blockType = getBlockType( fallbackBlockName );
		}

		return blockType
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
