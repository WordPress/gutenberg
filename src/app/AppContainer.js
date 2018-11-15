/** @flow
 * @format */

import MainApp from './MainApp';
import React from 'react';
import { parse, serialize } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';
import type { BlockType } from '../store/types';

type PropsType = {
	rootClientId: string,
	isBlockSelected: string => boolean,
	selectedBlockIndex: number,
	blocks: Array<BlockType>,
	onInsertBlock: ( BlockType, number, string ) => mixed,
	onMerge: ( string, string ) => mixed,
	onMoveDown: string => mixed,
	onMoveUp: string => mixed,
	onRemove: string => mixed,
	onResetBlocks: Array<BlockType> => mixed,
	onSelect: string => mixed,
	onAttributesUpdate: ( string, mixed ) => mixed,
	initialHtml: string,
};

class AppContainer extends React.Component<PropsType> {
	constructor( props: PropsType ) {
		super( props );

		this.parseBlocksAction( props.initialHtml );
	}

	onChange = ( clientId, attributes ) => {
		this.props.onAttributesUpdate( clientId, attributes );
	};

	focusBlockAction = ( clientId ) => {
		this.props.onSelect( clientId );
	};

	moveBlockUpAction = ( clientId ) => {
		this.props.onMoveUp( clientId );
	};

	moveBlockDownAction = ( clientId ) => {
		this.props.onMoveDown( clientId );
	};

	deleteBlockAction = ( clientId ) => {
		this.props.onRemove( clientId );
	};

	createBlockAction = ( clientId, block ) => {
		this.props.onInsertBlock( block, this.props.selectedBlockIndex + 1, this.props.rootClientId );
	};

	parseBlocksAction = ( html = '' ) => {
		const parsed = parse( html );
		this.props.onResetBlocks( parsed );
	};

	serializeToNativeAction = () => {
		const html = serialize( this.props.blocks );
		RNReactNativeGutenbergBridge.provideToNative_Html( html );
	};

	mergeBlocksAction = ( blockOneClientId, blockTwoClientId ) => {
		this.props.onMerge( blockOneClientId, blockTwoClientId );
	};

	render() {
		return (
			<MainApp
				blocks={ this.props.blocks }
				onChange={ this.onChange }
				focusBlockAction={ this.focusBlockAction }
				moveBlockUpAction={ this.moveBlockUpAction }
				moveBlockDownAction={ this.moveBlockDownAction }
				deleteBlockAction={ this.deleteBlockAction }
				createBlockAction={ this.createBlockAction }
				parseBlocksAction={ this.parseBlocksAction }
				serializeToNativeAction={ this.serializeToNativeAction }
				mergeBlocksAction={ this.mergeBlocksAction }
				isBlockSelected={ this.props.isBlockSelected }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getBlockIndex,
			getBlocks,
			getSelectedBlockClientId,
			isBlockSelected,
		} = select( 'core/editor' );
		const selectedBlockClientId = getSelectedBlockClientId();

		return {
			isBlockSelected,
			selectedBlockIndex: getBlockIndex( selectedBlockClientId ),
			blocks: getBlocks(),
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
			clearSelectedBlock,
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
