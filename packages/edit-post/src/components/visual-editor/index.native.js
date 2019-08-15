/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { BlockList } from '@wordpress/block-editor';
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
			isFullyBordered,
			safeAreaBottomInset,
		} = this.props;

		return (
			<BlockList
				header={ this.renderHeader() }
				isFullyBordered={ isFullyBordered }
				safeAreaBottomInset={ safeAreaBottomInset }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			getEditedPostAttribute,
		} = select( 'core/editor' );

		return {
			title: getEditedPostAttribute( 'title' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			editPost,
		} = dispatch( 'core/editor' );

		const { clearSelectedBlock } = dispatch( 'core/block-editor' );

		return {
			clearSelectedBlock,
			editTitle( title ) {
				editPost( { title } );
			},
		};
	} ),
] )( VisualEditor );
