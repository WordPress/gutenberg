/**
* @format
* @flow
*/

import React from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import InlineToolbar, { InlineToolbarActions } from './inline-toolbar';

import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

import type { BlockType } from '../store/types';

import styles from './block-holder.scss';

// Gutenberg imports
import { BlockEdit } from '@wordpress/editor';

import TextInputState from 'react-native/lib/TextInputState';

type PropsType = BlockType & {
	clientId: string,
	rootClientId: string,
	isSelected: boolean,
	isFirstBlock: boolean,
	isLastBlock: boolean,
	showTitle: boolean,
	getBlockIndex: ( clientId: string, rootClientId: string ) => number,
	getPreviousBlockClientId: ( clientId: string ) => string,
	getNextBlockClientId: ( clientId: string ) => string,
	onChange: ( clientId: string, attributes: mixed ) => void,
	onReplace: ( blocks: Array<Object> ) => void,
	onInsertBlocks: ( blocks: Array<Object>, index: number ) => void,
	onInlineToolbarButtonPressed: ( button: number, clientId: string ) => void,
	onSelect: ( clientId: string ) => void,
	mergeBlocks: ( clientId: string, clientId: string ) => void,
	moveBlocksUp: ( clientId: string ) => void,
	moveBlocksDown: ( clientId: string ) => void,
	removeBlock: ( clientId: string ) => void,
	replaceBlock: ( clientId: string ) => void,
};

export class BlockHolder extends React.Component<PropsType> {
	onFocus = ( event ) => {
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
		this.props.onSelect( this.props.clientId );
	};

	onInlineToolbarButtonPressed = ( button: number, clientId: string ) => {
		switch ( button ) {
			case InlineToolbarActions.UP:
				this.props.moveBlocksUp( clientId );
				break;
			case InlineToolbarActions.DOWN:
				this.props.moveBlocksDown( clientId );
				break;
			case InlineToolbarActions.DELETE:
				this.props.removeBlock( clientId );
				break;
		}
	};

	insertBlocksAfter = ( blocks: Array<Object> ) => {
		const order = this.props.getBlockIndex( this.props.clientId, this.props.rootClientId );
		this.props.onInsertBlocks( blocks, order + 1 );

		if ( blocks[ 0 ] ) {
			// focus on the first block inserted
			this.props.onSelect( blocks[ 0 ].clientId );
		}
	};

	mergeBlocks = ( forward: boolean = false ) => {
		const {
			clientId,
			getPreviousBlockClientId,
			getNextBlockClientId,
			mergeBlocks,
		} = this.props;

		const previousBlockClientId = getPreviousBlockClientId( clientId );
		const nextBlockClientId = getNextBlockClientId( clientId );

		// Do nothing when it's the first block.
		if (
			( ! forward && ! previousBlockClientId ) ||
			( forward && ! nextBlockClientId )
		) {
			return;
		}

		if ( forward ) {
			mergeBlocks( clientId, nextBlockClientId );
		} else {
			mergeBlocks( previousBlockClientId, clientId );
		}
	};

	renderToolbar() {
		if ( ! this.props.isSelected ) {
			return null;
		}

		return (
			<InlineToolbar
				clientId={ this.props.clientId }
				onButtonPressed={ this.onInlineToolbarButtonPressed }
				canMoveUp={ ! this.props.isFirstBlock }
				canMoveDown={ ! this.props.isLastBlock }
			/>
		);
	}

	getBlockForType() {
		return (
			<BlockEdit
				name={ this.props.name }
				isSelected={ this.props.isSelected }
				attributes={ this.props.attributes }
				setAttributes={ this.props.onChange }
				onFocus={ this.onFocus }
				onReplace={ this.props.replaceBlock }
				insertBlocksAfter={ this.insertBlocksAfter }
				mergeBlocks={ this.mergeBlocks }
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
		const { isSelected } = this.props;

		return (
			<TouchableWithoutFeedback onPress={ this.onFocus } >
				<View style={ [ styles.blockHolder, isSelected && styles.blockHolderFocused ] }>
					{ this.props.showTitle && this.renderBlockTitle() }
					<View style={ [ ! isSelected && styles.blockContainer, isSelected && styles.blockContainerFocused ] }>{ this.getBlockForType() }</View>
					{ this.renderToolbar() }
				</View>
			</TouchableWithoutFeedback>
		);
	}
}

export default compose( [
	withSelect( ( select, { clientId, rootClientId } ) => {
		const {
			getBlockAttributes,
			getBlockName,
			getBlockIndex,
			getBlocks,
			getPreviousBlockClientId,
			getNextBlockClientId,
			isBlockSelected,
		} = select( 'core/editor' );
		const name = getBlockName( clientId );
		const attributes = getBlockAttributes( clientId );
		const order = getBlockIndex( clientId, rootClientId );
		const isSelected = isBlockSelected( clientId );
		const isFirstBlock = order === 0;
		const isLastBlock = order === getBlocks().length - 1;

		return {
			attributes,
			getBlockIndex,
			getPreviousBlockClientId,
			getNextBlockClientId,
			isFirstBlock,
			isLastBlock,
			isSelected,
			name,
		};
	} ),
	withDispatch( ( dispatch, { clientId, rootClientId } ) => {
		const {
			clearSelectedBlock,
			insertBlocks,
			mergeBlocks,
			moveBlocksDown,
			moveBlocksUp,
			removeBlock,
			replaceBlock,
			resetBlocks,
			selectBlock,
			updateBlockAttributes,
			toggleBlockMode,
		} = dispatch( 'core/editor' );

		return {
			clearSelectedBlock,
			mergeBlocks,
			moveBlocksDown,
			moveBlocksUp,
			removeBlock,
			resetBlocks,
			toggleBlockMode,
			onInsertBlocks( blocks, index ) {
				insertBlocks( blocks, index, rootClientId );
			},
			onSelect: ( selectedClientId ) => {
				clearSelectedBlock();
				selectBlock( selectedClientId );
			},
			onChange: ( attributes ) => {
				updateBlockAttributes( clientId, attributes );
			},
			replaceBlock,
		};
	} ),
] )( BlockHolder );
