/** @flow
 * @format */

import { connect } from 'react-redux';
import MainApp from './MainApp';

import { parse, serialize } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { BlockEdit } from '@wordpress/editor';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

const mapStateToProps = ( state, ownProps ) => {
	return {
		blocks: ownProps.blocks.map( block => {
			block.focused = ownProps.isBlockSelected( block.clientId );
			return block;
		} ),
		refresh: ! ownProps.refresh
	}
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
			ownProps.onInsertBlock( block, ownProps.selectedBlockIndex + 1 );
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
			isBlockSelected,
			selectedBlockIndex: getBlockIndex( selectedBlockClientId, rootClientId ),
			blocks: getBlocks(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
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
			onSelect: selectBlock,
			onAttributesUpdate: updateBlockAttributes,
		};
	} ),
] )( AppContainer );
