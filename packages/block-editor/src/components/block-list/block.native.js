/**
 * External dependencies
 */
import {
	View,
	Text,
	TouchableWithoutFeedback,
} from 'react-native';
import TextInputState from 'react-native/lib/TextInputState';
import {
	requestImageUploadCancel,
} from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { addAction, removeAction, hasAction } from '@wordpress/hooks';
import { getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import styles from './block.scss';
import BlockEdit from '../block-edit';
import { default as BlockInspector, BlockInspectorActions } from '../block-inspector';

export class BlockListBlock extends Component {
	constructor( props ) {
		super( props );

		this.onFocus = this.onFocus.bind( this );
		this.insertBlocksAfter = this.insertBlocksAfter.bind( this );
		this.mergeBlocks = this.mergeBlocks.bind( this );
		this.onRemoveBlockCheckUpload = this.onRemoveBlockCheckUpload.bind( this );
		this.onBlockInspectorButtonPressed = this.onBlockInspectorButtonPressed.bind( this );

		this.state = {
			isFullyBordered: false,
		};
	}

	onFocus( event ) {
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
	}

	onRemoveBlockCheckUpload( mediaId ) {
		if ( hasAction( 'blocks.onRemoveBlockCheckUpload' ) ) {
			// now remove the action as it's  a one-shot use and won't be needed anymore
			removeAction( 'blocks.onRemoveBlockCheckUpload', 'gutenberg-mobile/blocks' );
			requestImageUploadCancel( mediaId );
		}
	}

	onBlockInspectorButtonPressed( button ) {
		switch ( button ) {
			case BlockInspectorActions.UP:
				this.props.moveBlockUp();
				break;
			case BlockInspectorActions.DOWN:
				this.props.moveBlockDown();
				break;
			case BlockInspectorActions.DELETE:
				// adding a action that will exist for as long as it takes for the block to be removed and the component unmounted
				// this acts as a flag for the code using the action to know of its existence
				addAction( 'blocks.onRemoveBlockCheckUpload', 'gutenberg-mobile/blocks', this.onRemoveBlockCheckUpload );
				this.props.removeBlock();
				break;
		}
	}

	insertBlocksAfter( blocks ) {
		const order = this.props.getBlockIndex( this.props.clientId, this.props.rootClientId );
		this.props.onInsertBlocks( blocks, order + 1 );

		if ( blocks[ 0 ] ) {
			// focus on the first block inserted
			this.props.onSelect( blocks[ 0 ].clientId );
		}
	}

	mergeBlocks( forward = false ) {
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
			const name = this.props.getBlockName( previousBlockClientId );
			const blockType = getBlockType( name );
			// The default implementation does only focus the previous block if it's not mergeable
			// We don't want to move the focus for now, just keep for and caret at the beginning of the current block.
			if ( ! blockType.merge ) {
				return;
			}
			mergeBlocks( previousBlockClientId, clientId );
		}
	}

	renderToolbar() {
		if ( ! this.props.isSelected ) {
			return null;
		}

		return (
			<BlockInspector
				clientId={ this.props.clientId }
				onButtonPressed={ this.onBlockInspectorButtonPressed }
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
				onReplace={ this.props.onReplace }
				insertBlocksAfter={ this.insertBlocksAfter }
				mergeBlocks={ this.mergeBlocks }
				onCaretVerticalPositionChange={ this.props.onCaretVerticalPositionChange }
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
		const { isSelected, borderStyle, focusedBorderColor } = this.props;

		const borderColor = isSelected ? focusedBorderColor : 'transparent';

		return (
			<TouchableWithoutFeedback onPress={ this.onFocus } >
				<View style={ [ styles.blockHolder, borderStyle, { borderColor } ] }>
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
		} = select( 'core/block-editor' );
		const name = getBlockName( clientId );
		const attributes = getBlockAttributes( clientId );
		const order = getBlockIndex( clientId, rootClientId );
		const isSelected = isBlockSelected( clientId );
		const isFirstBlock = order === 0;
		const isLastBlock = order === getBlocks().length - 1;

		return {
			attributes,
			getBlockIndex,
			getBlockName,
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
			replaceBlocks,
			selectBlock,
			updateBlockAttributes,
		} = dispatch( 'core/block-editor' );

		return {
			mergeBlocks,
			moveBlockDown() {
				moveBlocksDown( clientId );
			},
			moveBlockUp() {
				moveBlocksUp( clientId );
			},
			removeBlock() {
				removeBlock( clientId );
			},
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
			onReplace( blocks ) {
				replaceBlocks( [ clientId ], blocks );
			},
		};
	} ),
] )( BlockListBlock );
