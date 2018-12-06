/** @flow
 * @format */

import React from 'react';
import { parse, serialize } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

import MainApp from './MainApp';
import type { BlockType } from '../store/types';

type PropsType = {
	rootClientId: ?string,
	isBlockSelected: string => boolean,
	showHtml: boolean,
	editedPostContent: string,
	selectedBlockIndex: number,
	blocks: Array<BlockType>,
	onInsertBlock: ( BlockType, number, ?string ) => mixed,
	onMerge: ( string, string ) => mixed,
	onMoveDown: ( string, ?string ) => mixed,
	onMoveUp: ( string, ?string ) => mixed,
	onRemove: ( string, ?string ) => mixed,
	onToggleBlockMode: ?string => mixed,
	onResetBlocks: Array<BlockType> => mixed,
	onSelect: string => mixed,
	clearSelectedBlock: void => void,
	onAttributesUpdate: ( string, mixed ) => mixed,
	initialHtml: string,
	setupEditor: ( mixed, ?mixed ) => mixed,
	clientId: string,
};

class AppContainer extends React.Component<PropsType> {
	lastHtml: ?string;

	constructor( props: PropsType ) {
		super( props );

		const post = props.post || {
			id: 1,
			content: {
				raw: props.initialHtml,
			},
			type: 'draft',
		};

		this.props.setupEditor( post );
		this.lastHtml = serialize( parse( props.initialHtml ) );
	}

	onChange = ( clientId, attributes ) => {
		this.props.onAttributesUpdate( clientId, attributes );
	};

	focusBlockAction = ( clientId ) => {
		this.props.onSelect( clientId );
	};

	moveBlockUpAction = ( clientId ) => {
		this.props.onMoveUp( clientId, this.props.rootClientId );
	};

	moveBlockDownAction = ( clientId ) => {
		this.props.onMoveDown( clientId, this.props.rootClientId );
	};

	deleteBlockAction = ( clientId ) => {
		this.props.onRemove( clientId, this.props.rootClientId );
	};

	createBlockAction = ( clientId, block ) => {
		const indexAfterSelected = this.props.selectedBlockIndex + 1;
		const insertionIndex = indexAfterSelected || this.props.blocks.length;
		this.props.onInsertBlock( block, insertionIndex, this.props.rootClientId );
	};

	parseBlocksAction = ( html = '' ) => {
		const parsed = parse( html );
		this.props.onResetBlocks( parsed );
	};

	serializeToNativeAction = () => {
		if ( this.props.showHtml ) {
			this.parseBlocksAction( this.props.editedPostContent );
		}
		const html = serialize( this.props.blocks );
		RNReactNativeGutenbergBridge.provideToNative_Html( html, this.lastHtml !== html );
		this.lastHtml = html;
	};

	toggleHtmlModeAction = () => {
		this.props.onToggleBlockMode( this.props.rootClientId );
	};

	updateHtmlAction = ( html: string ) => {
		this.parseBlocksAction( html );
	};

	mergeBlocksAction = ( blockOneClientId, blockTwoClientId ) => {
		this.props.onMerge( blockOneClientId, blockTwoClientId );
	};

	render() {
		return (
			<MainApp
				rootClientId={ this.props.rootClientId }
				blocks={ this.props.blocks }
				showHtml={ this.props.showHtml }
				onChange={ this.onChange }
				focusBlockAction={ this.focusBlockAction }
				moveBlockUpAction={ this.moveBlockUpAction }
				moveBlockDownAction={ this.moveBlockDownAction }
				deleteBlockAction={ this.deleteBlockAction }
				createBlockAction={ this.createBlockAction }
				serializeToNativeAction={ this.serializeToNativeAction }
				toggleHtmlModeAction={ this.toggleHtmlModeAction }
				updateHtmlAction={ this.updateHtmlAction }
				mergeBlocksAction={ this.mergeBlocksAction }
				isBlockSelected={ this.props.isBlockSelected }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select, { rootClientId } ) => {
		const {
			getBlockIndex,
			getBlocks,
			getSelectedBlockClientId,
			isBlockSelected,
			getBlockMode,
			getEditedPostContent,
		} = select( 'core/editor' );
		const selectedBlockClientId = getSelectedBlockClientId();

		return {
			isBlockSelected,
			selectedBlockIndex: getBlockIndex( selectedBlockClientId, rootClientId ),
			blocks: getBlocks( rootClientId ),
			showHtml: getBlockMode( rootClientId ) === 'html',
			editedPostContent: getEditedPostContent(),
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
			setupEditor,
			updateBlockAttributes,
			toggleBlockMode,
		} = dispatch( 'core/editor' );

		return {
			clearSelectedBlock,
			onInsertBlock: insertBlock,
			onMerge: mergeBlocks,
			onMoveDown: moveBlocksDown,
			onMoveUp: moveBlocksUp,
			onRemove: removeBlock,
			onResetBlocks: resetBlocks,
			onToggleBlockMode: toggleBlockMode,
			onSelect: ( clientId ) => {
				clearSelectedBlock();
				selectBlock( clientId );
			},
			onAttributesUpdate: updateBlockAttributes,
			setupEditor,
		};
	} ),
] )( AppContainer );
