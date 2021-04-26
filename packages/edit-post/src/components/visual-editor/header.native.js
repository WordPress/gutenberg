/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { PostTitle, store as editorStore } from '@wordpress/editor';
import { ReadableContentView } from '@wordpress/components';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const Header = memo(
	function EditorHeader( {
		editTitle,
		setTitleRef,
		title,
		getStylesFromColorScheme,
	} ) {
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
					borderStyle={ styles.blockHolderFullBordered }
					focusedBorderColor={ blockHolderFocusedStyle.borderColor }
					accessibilityLabel="post-title"
				/>
			</ReadableContentView>
		);
	},
	( prevProps, nextProps ) => prevProps.title === nextProps.title
);

export default compose( [
	withSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );

		return {
			title: getEditedPostAttribute( 'title' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost } = dispatch( editorStore );

		const { clearSelectedBlock } = dispatch( blockEditorStore );

		return {
			clearSelectedBlock,
			editTitle( title ) {
				editPost( { title } );
			},
		};
	} ),
	withPreferredColorScheme,
] )( Header );
