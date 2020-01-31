/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
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
			getStylesFromColorScheme,
		} = this.props;
		const blockHolderFocusedStyle = getStylesFromColorScheme(
			styles.blockHolderFocused,
			styles.blockHolderFocusedDark
		);
		return (
			<ReadableContentView>
				<PostTitle
					innerRef={ setTitleRef }
					title={ title }
					onUpdate={ editTitle }
					placeholder={ __( 'Add title' ) }
					borderStyle={
						this.props.isFullyBordered
							? styles.blockHolderFullBordered
							: styles.blockHolderSemiBordered
					}
					focusedBorderColor={ blockHolderFocusedStyle.borderColor }
					accessibilityLabel="post-title"
				/>
			</ReadableContentView>
		);
	}

	render() {
		const { isFullyBordered, safeAreaBottomInset } = this.props;

		return (
			<BlockList
				header={ this.renderHeader() }
				isFullyBordered={ isFullyBordered }
				safeAreaBottomInset={ safeAreaBottomInset }
				autoScroll={ true }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getEditedPostAttribute } = select( 'core/editor' );

		return {
			title: getEditedPostAttribute( 'title' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost } = dispatch( 'core/editor' );

		const { clearSelectedBlock } = dispatch( 'core/block-editor' );

		return {
			clearSelectedBlock,
			editTitle( title ) {
				editPost( { title } );
			},
		};
	} ),
	withPreferredColorScheme,
] )( VisualEditor );
