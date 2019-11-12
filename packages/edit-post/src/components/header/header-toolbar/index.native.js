/**
 * External dependencies
 */
import { useRef } from 'react';
import { ScrollView, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { __ } from '@wordpress/i18n';
import {
	Inserter,
	BlockToolbar,
} from '@wordpress/block-editor';
import { Toolbar, ToolbarButton } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from './style.scss';

function HeaderToolbar( {
	hasFixedToolbar,
	hasRedo,
	hasUndo,
	redo,
	undo,
	showInserter,
	showKeyboardHideButton,
	getStylesFromColorScheme,
	onHideKeyboard,
} ) {
	const scrollViewRef = useRef( null );
	const scrollToStart = () => {
		scrollViewRef.current.scrollTo( { x: 0 } );
	};

	return (
		<View style={ getStylesFromColorScheme( styles.container, styles.containerDark ) }>
			<ScrollView
				ref={ scrollViewRef }
				onContentSizeChange={ scrollToStart }
				horizontal={ true }
				showsHorizontalScrollIndicator={ false }
				keyboardShouldPersistTaps="always"
				alwaysBounceHorizontal={ false }
				contentContainerStyle={ styles.scrollableContent }
			>
				<Toolbar accessible={ false }>
					<Inserter disabled={ ! showInserter } />
					{ /* TODO: replace with EditorHistoryRedo and EditorHistoryUndo */ }
					<ToolbarButton
						title={ __( 'Undo' ) }
						icon="undo"
						isDisabled={ ! hasUndo }
						onClick={ undo }
						extraProps={ { hint: __( 'Double tap to undo last change' ) } }
					/>
					<ToolbarButton
						title={ __( 'Redo' ) }
						icon="redo"
						isDisabled={ ! hasRedo }
						onClick={ redo }
						extraProps={ { hint: __( 'Double tap to redo last change' ) } }
					/>
				</Toolbar>
				{ hasFixedToolbar &&
					<BlockToolbar />
				}
			</ScrollView>
			{ showKeyboardHideButton &&
				<Toolbar passedStyle={ styles.keyboardHideContainer }>
					<ToolbarButton
						title={ __( 'Hide keyboard' ) }
						icon="keyboard-hide"
						onClick={ onHideKeyboard }
						extraProps={ { hint: __( 'Tap to hide the keyboard' ) } }
					/>
				</Toolbar>
			}
		</View>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		hasRedo: select( 'core/editor' ).hasEditorRedo(),
		hasUndo: select( 'core/editor' ).hasEditorUndo(),
		hasFixedToolbar: select( 'core/edit-post' ).isFeatureActive( 'fixedToolbar' ),
		// This setting (richEditingEnabled) should not live in the block editor's setting.
		showInserter: select( 'core/edit-post' ).getEditorMode() === 'visual' && select( 'core/editor' ).getEditorSettings().richEditingEnabled,
		isTextModeEnabled: select( 'core/edit-post' ).getEditorMode() === 'text',
	} ) ),
	withDispatch( ( dispatch ) => {
		const { clearSelectedBlock } = dispatch( 'core/block-editor' );
		const { togglePostTitleSelection } = dispatch( 'core/editor' );

		return {
			redo: dispatch( 'core/editor' ).redo,
			undo: dispatch( 'core/editor' ).undo,
			onHideKeyboard() {
				clearSelectedBlock();
				togglePostTitleSelection( false );
			},
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withPreferredColorScheme,
] )( HeaderToolbar );
