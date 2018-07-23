/**
 * @format
 * @flow
 */

import React from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import RCTAztecView from 'react-native-aztec';
import Toolbar from './toolbar';

import type { BlockType } from '../store/';

import styles from './block-holder.scss';

// Gutenberg imports
import { getBlockType } from '@gutenberg/blocks/api';

type PropsType = BlockType & {
	onChange: ( uid: string, attributes: mixed ) => void,
	onToolbarButtonPressed: ( button: number, uid: string ) => void,
	onBlockHolderPressed: ( uid: string ) => void,
};
type StateType = {
	selected: boolean,
	focused: boolean,
	aztecHeight: number,
};

const _minHeight = 50;

export default class BlockHolder extends React.Component<PropsType, StateType> {
	constructor( props: PropsType ) {
		super( props );
		this.state = {
			selected: false,
			focused: false,
			aztecHeight: _minHeight,
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
		const blockType = getBlockType( this.props.name );
		if ( blockType ) {
			const Block = blockType.edit;

			let style;
			if ( blockType.name === 'core/code' ) {
				style = styles.block_code;
			}

			// TODO: setAttributes needs to change the state/attributes
			return (
				<Block
					attributes={ { ...this.props.attributes } }
					// pass a curried version of onChanged with just one argument
					setAttributes={ ( attrs ) => this.props.onChange( this.props.uid, attrs ) }
					isSelected={ this.props.focused }
					style={ style }
				/>
			);
		} else if ( this.props.name === 'aztec' ) {
			return (
				<RCTAztecView
					accessibilityLabel="aztec-view"
					style={ [
						styles[ 'aztec-editor' ],
						{ minHeight: Math.max( _minHeight, this.state.aztecHeight ) },
					] }
					text={ { text: this.props.attributes.content, eventCount: this.props.attributes.eventCount } }
					onContentSizeChange={ ( event ) => {
						this.setState( { ...this.state, aztecHeight: event.nativeEvent.contentSize.height } );
					} }
					onChange={ ( event ) => {
						console.log(event.nativeEvent.text),
						this.props.onChange( this.props.uid, {
							...this.props.attributes,
							content: event.nativeEvent.text,
							eventCount: event.nativeEvent.eventCount,
						} );
					} }
					color={ 'black' }
					maxImagesWidth={ 200 }
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
