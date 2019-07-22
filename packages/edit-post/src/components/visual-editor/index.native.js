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
	constructor() {
		super( ...arguments );

		this.onPostTitleSelect = this.onPostTitleSelect.bind( this );
		this.onPostTitleUnselect = this.onPostTitleUnselect.bind( this );

		this.state = {
			isPostTitleSelected: false,
		};
	}

	static getDerivedStateFromProps( props ) {
		if ( props.isAnyBlockSelected ) {
			return { isPostTitleSelected: false };
		}
		return null;
	}

	onPostTitleSelect() {
		this.setState( { isPostTitleSelected: true } );
		this.props.clearSelectedBlock();
	}

	onPostTitleUnselect() {
		this.setState( { isPostTitleSelected: false } );
	}

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
					onSelect={ this.onPostTitleSelect }
					onUnselect={ this.onPostTitleUnselect }
					isSelected={ this.state.isPostTitleSelected }
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
					isPostTitleSelected={ this.state.isPostTitleSelected }
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
		} = select( 'core/editor' );

		const { getSelectedBlockClientId } = select( 'core/block-editor' );

		return {
			blocks: getEditorBlocks(),
			title: getEditedPostAttribute( 'title' ),
			isAnyBlockSelected: !! getSelectedBlockClientId(),
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
