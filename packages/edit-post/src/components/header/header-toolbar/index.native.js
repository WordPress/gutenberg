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
import { Toolbar, ToolbarButton, Tooltip } from '@wordpress/components';
import {
	keyboardClose,
	undo as undoIcon,
	redo as redoIcon,
} from '@wordpress/icons';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { store as editPostStore } from '../../../store';

function HeaderToolbar( {
	canViewEditorOnboarding,
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
				icon={ ! isRTL ? undoIcon : redoIcon }
				isDisabled={ ! hasUndo }
				onClick={ undo }
				extraProps={ {
					hint: __( 'Double tap to undo last change' ),
				} }
			/>,
			<ToolbarButton
				key="redoButton"
				title={ __( 'Redo' ) }
				icon={ ! isRTL ? redoIcon : undoIcon }
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
				<Tooltip
					position="top right"
					text={ __( 'Tap to add content' ) }
					visible={ canViewEditorOnboarding }
				>
					{ /* TODO(David): Wrapper View added as quick way to avoid the need to forward refs */ }
					<View style={ { alignItems: 'center' } }>
						<Inserter disabled={ ! showInserter } />
					</View>
				</Tooltip>
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
	withSelect( ( select ) => {
		const { hasEditorRedo, hasEditorUndo, getEditorSettings } = select(
			editorStore
		);
		const { getEditorMode } = select( editPostStore );
		const { getSettings } = select( blockEditorStore );
		return {
			hasRedo: hasEditorRedo(),
			hasUndo: hasEditorUndo(),
			// This setting (richEditingEnabled) should not live in the block editor's setting.
			showInserter:
				getEditorMode() === 'visual' &&
				getEditorSettings().richEditingEnabled,
			isTextModeEnabled: getEditorMode() === 'text',
			isRTL: getSettings().isRTL,
			canViewEditorOnboarding: getSettings().canViewEditorOnboarding,
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { clearSelectedBlock } = dispatch( blockEditorStore );
		const { togglePostTitleSelection } = dispatch( editorStore );

		return {
			redo: dispatch( editorStore ).redo,
			undo: dispatch( editorStore ).undo,
			onHideKeyboard() {
				clearSelectedBlock();
				togglePostTitleSelection( false );
			},
		};
	} ),
	withViewportMatch( { isLargeViewport: 'medium' } ),
	withPreferredColorScheme,
] )( HeaderToolbar );
