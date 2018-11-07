/** @flow
 * @format */

import { connect } from 'react-redux';
import {
	updateBlockAttributes,
	focusBlockAction,
	moveBlockUpAction,
	moveBlockDownAction,
	deleteBlockAction,
	createBlockAction,
	parseBlocksAction,
	serializeToNativeAction,
	mergeBlocksAction,
} from '../store/actions';
import MainApp from './MainApp';

import { parse, serialize } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { BlockEdit } from '@wordpress/editor';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

const mapStateToProps = ( state ) => ( {
	...state,
} );

const mapDispatchToProps = ( dispatch, ownProps ) => {
	return {
		...ownProps,
		onChange: ( clientId, attributes ) => {
			dispatch( updateBlockAttributes( clientId, attributes ) );
			ownProps.onAttributesUpdate( clientId, attributes );
		},
		focusBlockAction: ( clientId ) => {
			dispatch( focusBlockAction( clientId ) );
			ownProps.onSelect( clientId );
		},
		moveBlockUpAction: ( clientId ) => {
			dispatch( moveBlockUpAction( clientId ) );
			ownProps.onMoveUp( clientId );
		},
		moveBlockDownAction: ( clientId ) => {
			dispatch( moveBlockDownAction( clientId ) );
			ownProps.onMoveDown( clientId );
		},
		deleteBlockAction: ( clientId ) => {
			dispatch( deleteBlockAction( clientId ) );
			ownProps.onRemove( clientId );
		},
		createBlockAction: ( clientId, block, clientIdAbove ) => {
			dispatch( createBlockAction( clientId, block, clientIdAbove ) );
			ownProps.onInsertBlock( block, ownProps.selectedBlockIndex + 1 );
		},
		parseBlocksAction: ( html ) => {
			dispatch( parseBlocksAction( html ) );
			const parsed = parse( html );
			ownProps.onResetBlocks( parsed );
		},
		serializeToNativeAction: () => {
			dispatch( serializeToNativeAction() );
			const html = serialize( ownProps.blocks );
			RNReactNativeGutenbergBridge.provideToNative_Html( html );
		},
		mergeBlocksAction: ( blockOneClientId, blockTwoClientId, block ) => {
			dispatch( mergeBlocksAction( blockOneClientId, blockTwoClientId, block ) );
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
		} = select( 'core/editor' );
		const { rootClientId } = ownProps;
		const selectedBlockClientId = getSelectedBlockClientId();

		return {
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
			onAttributesUpdate: updateBlockAttributes
		};
	} ),
] )( AppContainer );
