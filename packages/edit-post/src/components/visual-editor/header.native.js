/**
 * External dependencies
 */
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { PostTitle } from '@wordpress/editor';
import {
	store as blockEditorStore,
	useEditorWrapperStyles,
} from '@wordpress/block-editor';

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
		const [ wrapperStyles ] = useEditorWrapperStyles();
		const blockHolderFocusedStyle = getStylesFromColorScheme(
			styles.blockHolderFocused,
			styles.blockHolderFocusedDark
		);
		return (
			<View style={ wrapperStyles }>
				<PostTitle
					innerRef={ setTitleRef }
					title={ title }
					onUpdate={ editTitle }
					placeholder={ __( 'Add title' ) }
					borderStyle={ styles.blockHolderFullBordered }
					focusedBorderColor={ blockHolderFocusedStyle.borderColor }
					accessibilityLabel="post-title"
				/>
			</View>
		);
	},
	( prevProps, nextProps ) => prevProps.title === nextProps.title
);

export default compose( [
	withSelect( ( select ) => {
		const { getEditedPostAttribute } = select( 'core/editor' );

		return {
			title: getEditedPostAttribute( 'title' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost } = dispatch( 'core/editor' );

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
