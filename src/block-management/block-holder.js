/**
* @format
* @flow
*/

import React from 'react';
import { View, Text, TouchableWithoutFeedback, Dimensions, LayoutChangeEvent } from 'react-native';
import InlineToolbar from './inline-toolbar';

import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

import type { BlockType } from '../store/types';

import styles from './block-holder.scss';

// Gutenberg imports
import { BlockEdit } from '@wordpress/editor';

import TextInputState from 'react-native/lib/TextInputState';

type PropsType = BlockType & {
	isSelected: boolean,
	showTitle: boolean,
	onChange: ( clientId: string, attributes: mixed ) => void,
	onReplace: ( blocks: Array<Object> ) => void,
	onInlineToolbarButtonPressed: ( button: number, clientId: string ) => void,
	onSelect: void => void,
	insertBlocksAfter: ( blocks: Array<Object> ) => void,
	mergeBlocks: ( forward: boolean ) => void,
	canMoveUp: boolean,
	canMoveDown: boolean,
};

type StateType = {
	isFullyBordered: boolean;
}

export class BlockHolder extends React.Component<PropsType, StateType> {
	constructor( props: PropsType ) {
		super( props );

		this.state = {
			isFullyBordered: false,
		};
	}

	renderToolbarIfBlockFocused() {
		if ( this.props.isSelected ) {
			return (
				<InlineToolbar
					clientId={ this.props.clientId }
					onButtonPressed={ this.props.onInlineToolbarButtonPressed }
					canMoveUp={ this.props.canMoveUp }
					canMoveDown={ this.props.canMoveDown }
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
				isSelected={ this.props.isSelected }
				attributes={ { ...this.props.attributes } }
				// pass a curried version of onChanged with just one argument
				setAttributes={ ( attrs ) =>
					this.props.onChange( this.props.clientId, { ...this.props.attributes, ...attrs } )
				}
				onFocus={ this.props.onSelect }
				onReplace={ this.props.onReplace }
				insertBlocksAfter={ this.props.insertBlocksAfter }
				mergeBlocks={ this.props.mergeBlocks }
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
		const { focused } = this.props;

		return (
			<TouchableWithoutFeedback onPress={ this.props.onSelect } onLayout={ this.onBlockHolderLayout } >
				<View style={ [ styles.blockHolder, focused && this.blockHolderFocusedStyle() ] } >
					{ this.props.showTitle && this.renderBlockTitle() }
					<View style={ [ ! focused && styles.blockContainer, focused && styles.blockContainerFocused ] }>{ this.getBlockForType() }</View>
					{ this.renderToolbarIfBlockFocused() }
				</View>
			</TouchableWithoutFeedback>
		);
	}

	onBlockHolderLayout = ( event: LayoutChangeEvent ) => {
		const { width: fullWidth } = Dimensions.get( 'window' );
		const { width } = event.nativeEvent.layout;
		const isFullyBordered = fullWidth > width;
		if ( isFullyBordered !== this.state.isFullyBordered ) {
			this.setState( { ...this.state, isFullyBordered } );
		}
	}

	blockHolderFocusedStyle() {
		return this.state.isFullyBordered ? styles.blockHolderFocusedFullBordered : styles.blockHolderFocusedSemiBordered;
	}
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const {
			isBlockSelected,
		} = select( 'core/editor' );
		const isSelected = isBlockSelected( clientId );

		return {
			isSelected,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		const {
			clearSelectedBlock,
			selectBlock,
		} = dispatch( 'core/editor' );

		return {
			onSelect: ( event ) => {
				if ( event ) {
					// == Hack for the Alpha ==
					// When moving the focus from a TextInput field to another kind of field the call that hides the keyboard is not invoked
					// properly, resulting in keyboard up when it should not be there.
					// The code below dismisses the keyboard (calling blur on the last TextInput field) when the field that now gets the focus is a non-textual field
					const currentlyFocusedTextInput = TextInputState.currentlyFocusedField();
					if ( event.nativeEvent.target !== currentlyFocusedTextInput && ! TextInputState.isTextInput( event.nativeEvent.target ) ) {
						TextInputState.blurTextInput( currentlyFocusedTextInput );
					}
				}
				clearSelectedBlock();
				selectBlock( clientId );
			},
		};
	} ),
] )( BlockHolder );
