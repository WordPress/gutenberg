/**
 * External dependencies
 */
import { ScrollView, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';
import { compose, withPreferredColorScheme } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { withViewportMatch } from '@wordpress/viewport';
import { __ } from '@wordpress/i18n';
import {
	Inserter,
	BlockToolbar,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Toolbar, ToolbarButton } from '@wordpress/components';
import {
	keyboardClose,
	undo as undoIcon,
	redo as redoIcon,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { store as editPostStore } from '../../../store';

function HeaderToolbar( {
	hasRedo,
	hasUndo,
	redo,
	undo,
	showInserter,
	showKeyboardHideButton,
	getStylesFromColorScheme,
	onHideKeyboard,
	isRTL,
} ) {
	const scrollViewRef = useRef( null );
	const scrollToStart = () => {
		scrollViewRef.current.scrollTo( { x: 0 } );
	};

	const renderHistoryButtons = () => {
		const buttons = [
			/* TODO: replace with EditorHistoryRedo and EditorHistoryUndo */
			<ToolbarButton
				key="undoButton"
				title={ __( 'Undo' ) }
				icon={ undoIcon }
				isDisabled={ ! hasUndo }
				onClick={ undo }
				extraProps={ {
					hint: __( 'Double tap to undo last change' ),
				} }
			/>,
			<ToolbarButton
				key="redoButton"
				title={ __( 'Redo' ) }
				icon={ redoIcon }
				isDisabled={ ! hasRedo }
				onClick={ redo }
				extraProps={ {
					hint: __( 'Double tap to redo last change' ),
				} }
			/>,
		];

		return isRTL ? buttons.reverse() : buttons;
	};

	return (
		<View
			style={ getStylesFromColorScheme(
				styles.container,
				styles.containerDark
			) }
		>
			<ScrollView
				ref={ scrollViewRef }
				onContentSizeChange={ scrollToStart }
				horizontal={ true }
				showsHorizontalScrollIndicator={ false }
				keyboardShouldPersistTaps="always"
				alwaysBounceHorizontal={ false }
				contentContainerStyle={ styles.scrollableContent }
			>
				<Inserter disabled={ ! showInserter } />
				{ renderHistoryButtons() }
				<BlockToolbar />
			</ScrollView>
			{ showKeyboardHideButton && (
				<Toolbar passedStyle={ styles.keyboardHideContainer }>
					<ToolbarButton
						title={ __( 'Hide keyboard' ) }
						icon={ keyboardClose }
						onClick={ onHideKeyboard }
						extraProps={ {
							hint: __( 'Tap to hide the keyboard' ),
						} }
					/>
				</Toolbar>
			) }
		</View>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		hasRedo: select( 'core/editor' ).hasEditorRedo(),
		hasUndo: select( 'core/editor' ).hasEditorUndo(),
		// This setting (richEditingEnabled) should not live in the block editor's setting.
		showInserter:
			select( editPostStore ).getEditorMode() === 'visual' &&
			select( 'core/editor' ).getEditorSettings().richEditingEnabled,
		isTextModeEnabled: select( editPostStore ).getEditorMode() === 'text',
		isRTL: select( blockEditorStore ).getSettings().isRTL,
	} ) ),
	withDispatch( ( dispatch ) => {
		const { clearSelectedBlock } = dispatch( blockEditorStore );
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
