/** @flow
 * @format */

import { connect } from 'react-redux';
import { cloneDeep } from 'lodash';

import MainApp from './MainApp';
import { parse, serialize } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

const mapStateToProps = ( state, ownProps ) => {
	const blocks = ownProps.blocksFromState.map( block => {
		const newBlock = cloneDeep( block );
		newBlock.focused = ownProps.isBlockSelected( block.clientId );
		return newBlock;
	} );

	return {
		blocks
	};
};

const mapDispatchToProps = ( dispatch, ownProps ) => {
	return {
		...ownProps,
		onChange: ( clientId, attributes ) => {
			ownProps.onAttributesUpdate( clientId, attributes );
		},
		focusBlockAction: ( clientId ) => {
			ownProps.onSelect( clientId );
		},
		moveBlockUpAction: ( clientId ) => {
			ownProps.onMoveUp( clientId );
		},
		moveBlockDownAction: ( clientId ) => {
			ownProps.onMoveDown( clientId );
		},
		deleteBlockAction: ( clientId ) => {
			ownProps.onRemove( clientId );
		},
		createBlockAction: ( clientId, block ) => {
			ownProps.onInsertBlock( block, ownProps.selectedBlockIndex + 1, ownProps.rootClientId );
		},
		parseBlocksAction: ( html ) => {
			const parsed = parse( html );
			ownProps.onResetBlocks( parsed );
		},
		serializeToNativeAction: () => {
			const html = serialize( ownProps.blocks );
			RNReactNativeGutenbergBridge.provideToNative_Html( html );
		},
		mergeBlocksAction: ( blockOneClientId, blockTwoClientId ) => {
			ownProps.onMerge( blockOneClientId, blockTwoClientId );
		},
	};
};

const AppContainer = connect( mapStateToProps, mapDispatchToProps )( MainApp );

export default compose( [
	withSelect( ( select, ownProps ) => {
		const {
			getBlockIndex,
			getBlocks,
			getSelectedBlockClientId,
			isBlockSelected,
		} = select( 'core/editor' );
		const { rootClientId } = ownProps;
		const selectedBlockClientId = getSelectedBlockClientId();

		return {
			rootClientId,
			isBlockSelected,
			selectedBlockIndex: getBlockIndex( selectedBlockClientId, rootClientId ),
			blocksFromState: getBlocks(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			clearSelectedBlock,
			insertBlock,
			mergeBlocks,
			moveBlocksDown,
			moveBlocksUp,
			removeBlock,
			resetBlocks,
			selectBlock,
			updateBlockAttributes,
		} = dispatch( 'core/editor' );

		return {
			onInsertBlock: insertBlock,
			onMerge: mergeBlocks,
			onMoveDown: moveBlocksDown,
			onMoveUp: moveBlocksUp,
			onRemove: removeBlock,
			onResetBlocks: resetBlocks,
			onSelect: ( clientId ) => {
				clearSelectedBlock();
				selectBlock( clientId );
			},
			onAttributesUpdate: updateBlockAttributes,
		};
	} ),
] )( AppContainer );
