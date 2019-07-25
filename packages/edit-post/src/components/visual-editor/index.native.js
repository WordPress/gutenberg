/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { PostTitle } from '@wordpress/editor';
import { ReadableContentView } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

class VisualEditor extends Component {
	renderHeader() {
		const {
			editTitle,
			setTitleRef,
			title,
		} = this.props;

		return (
			<ReadableContentView>
				<PostTitle
					innerRef={ setTitleRef }
					title={ title }
					onUpdate={ editTitle }
					placeholder={ __( 'Add title' ) }
					borderStyle={
						this.props.isFullyBordered ?
							styles.blockHolderFullBordered :
							styles.blockHolderSemiBordered
					}
					focusedBorderColor={ styles.blockHolderFocused.borderColor }
					accessibilityLabel="post-title"
				/>
			</ReadableContentView>
		);
	}

	render() {
		const {
			blocks,
			isFullyBordered,
			resetEditorBlocks,
			resetEditorBlocksWithoutUndoLevel,
			rootViewHeight,
			safeAreaBottomInset,
		} = this.props;

		return (
			<BlockEditorProvider
				value={ blocks }
				onInput={ resetEditorBlocksWithoutUndoLevel }
				onChange={ resetEditorBlocks }
				settings={ null }
			>
				<BlockList
					header={ this.renderHeader() }
					isFullyBordered={ isFullyBordered }
					rootViewHeight={ rootViewHeight }
					safeAreaBottomInset={ safeAreaBottomInset }
					isPostTitleSelected={ this.props.isPostTitleSelected }
					onBlockTypeSelected={ this.onPostTitleUnselect }
				/>
			</BlockEditorProvider>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getEditorBlocks,
			getEditedPostAttribute,
			isPostTitleSelected,
		} = select( 'core/editor' );

		return {
			blocks: getEditorBlocks(),
			title: getEditedPostAttribute( 'title' ),
			isPostTitleSelected: isPostTitleSelected(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			editPost,
			resetEditorBlocks,
		} = dispatch( 'core/editor' );

		const { clearSelectedBlock } = dispatch( 'core/block-editor' );

		return {
			clearSelectedBlock,
			editTitle( title ) {
				editPost( { title } );
			},
			resetEditorBlocks,
			resetEditorBlocksWithoutUndoLevel( blocks ) {
				resetEditorBlocks( blocks, {
					__unstableShouldCreateUndoLevel: false,
				} );
			},
		};
	} ),
] )( VisualEditor );
