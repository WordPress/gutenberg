/**
 * External dependencies
 */
import { ScrollView, View } from 'react-native';

/**
 * WordPress dependencies
 */
import { useState, useRef } from '@wordpress/element';
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
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import { store as editPostStore } from '../../../store';
import Tooltip from '../../../../../components/src/focal-point-picker/tooltip';

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
	const [ tooltipVisible, setTooltipVisible ] = useState( true );
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
		<Tooltip
			onPress={ () => setTooltipVisible( false ) }
			visible={ tooltipVisible }
		>
			<View
				style={ getStylesFromColorScheme(
					styles.container,
					styles.containerDark
				) }
			>
				{ /**
				 * TODO: David
				 *
				 * This works, but requires manual placement of the label above the
				 * reference. Cannot place tooltip inside of the ScrollView as elements
				 * overflowing are hidden entirely. Do we need an alternative method?
				 *
				 * Additionally, there are issue with dismissing. Scrolling content
				 * does not dismiss. Certain areas above the toolbar do not allow
				 * scrolling, which may be unrelated.
				 *
				 * Also, verify that tapping to dismissing anywhere works. Is it
				 * worthwhile creating an alternative API that matches the web's
				 * Tooltip and relies up Modal? All tips for this project do not point
				 * to content within a modal, so we don't have to worry about double
				 * modals on iOS.
				 */ }
				<Tooltip.Label
					align="left"
					xOffset={ 5 }
					text={ 'Tap to add content' }
				/>
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
		</Tooltip>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		hasRedo: select( editorStore ).hasEditorRedo(),
		hasUndo: select( editorStore ).hasEditorUndo(),
		// This setting (richEditingEnabled) should not live in the block editor's setting.
		showInserter:
			select( editPostStore ).getEditorMode() === 'visual' &&
			select( editorStore ).getEditorSettings().richEditingEnabled,
		isTextModeEnabled: select( editPostStore ).getEditorMode() === 'text',
		isRTL: select( blockEditorStore ).getSettings().isRTL,
	} ) ),
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
