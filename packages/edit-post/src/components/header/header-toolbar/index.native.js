/**
 * External dependencies
 */
import { ScrollView, Keyboard, Platform, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { __ } from '@wordpress/i18n';
import {
	Inserter,
	BlockToolbar,
} from '@wordpress/block-editor';
import {
	EditorHistoryRedo,
	EditorHistoryUndo,
} from '@wordpress/editor';
import { Toolbar, ToolbarButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

const hideKeyboard = () => {
	if ( Platform.OS === 'android' ) {
		// Avoiding extra blur calls on iOS but still needed for android.
		Keyboard.dismiss();
	}
};

function HeaderToolbar( {
	hasFixedToolbar,
	showInserter,
	showKeyboardHideButton,
} ) {
	return (
		<View>
			<ScrollView
				horizontal={ true }
				showsHorizontalScrollIndicator={ false }
				keyboardShouldPersistTaps="always"
				alwaysBounceHorizontal={ false }
				contentContainerStyle={ styles.scrollableContent }
			>
				<Inserter disabled={ ! showInserter } />
				<EditorHistoryUndo />
				<EditorHistoryRedo />
				{ hasFixedToolbar &&
					<BlockToolbar showKeyboardHideButton={ true } />
				}
			</ScrollView>
			{ showKeyboardHideButton &&
				<Toolbar passedStyle={ styles.keyboardHideContainer }>
					<ToolbarButton
						title={ __( 'Hide keyboard' ) }
						icon="keyboard-hide"
						onClick={ hideKeyboard }
						extraProps={ { hint: __( 'Tap to hide the keyboard' ) } }
					/>
				</Toolbar>
			}
		</View>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' ),
		// This setting (richEditingEnabled) should not live in the block editor's setting.
		showInserter: select( 'core/edit-post' ).getEditorMode() === 'visual' && select( 'core/editor' ).getEditorSettings().richEditingEnabled,
		isTextModeEnabled: select( 'core/edit-post' ).getEditorMode() === 'text',
	} ) ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
] )( HeaderToolbar );
