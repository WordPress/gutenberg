/**
 * External dependencies
 */
import { View, ScrollView, Keyboard, Platform } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { Toolbar, ToolbarButton, Dashicon } from '@wordpress/components';
import { BlockFormatControls, BlockControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';

export class BlockToolbar extends Component {
	constructor() {
		super( ...arguments );

		this.onKeyboardHide = this.onKeyboardHide.bind( this );
	}

	onKeyboardHide() {
		this.props.clearSelectedBlock();
		if ( Platform.OS === 'android' ) {
			// Avoiding extra blur calls on iOS but still needed for android.
			Keyboard.dismiss();
		}
	}

	render() {
		const {
			hasRedo,
			hasUndo,
			redo,
			undo,
			onInsertClick,
			showKeyboardHideButton,
		} = this.props;

		return (
			<View style={ styles.container } >
				<ScrollView
					horizontal={ true }
					showsHorizontalScrollIndicator={ false }
					keyboardShouldPersistTaps="always"
					alwaysBounceHorizontal={ false }
					contentContainerStyle={ styles.scrollableContent }
				>
					<Toolbar accessible={ false }>
						<ToolbarButton
							title={ __( 'Add block' ) }
							icon={ ( <Dashicon icon="plus-alt" style={ styles.addBlockButton } color={ styles.addBlockButton.color } /> ) }
							onClick={ onInsertClick }
							extraProps={ { hint: __( 'Double tap to add a block' ) } }
						/>
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
					<BlockControls.Slot />
					<BlockFormatControls.Slot />
				</ScrollView>
				{ showKeyboardHideButton &&
					<Toolbar passedStyle={ styles.keyboardHideContainer }>
						<ToolbarButton
							title={ __( 'Hide keyboard' ) }
							icon="keyboard-hide"
							onClick={ this.onKeyboardHide }
							extraProps={ { hint: __( 'Tap to hide the keyboard' ) } }
						/>
					</Toolbar>
				}
			</View>
		);
	}
}

export default compose( [
	withSelect( ( select ) => ( {
		hasRedo: select( 'core/editor' ).hasEditorRedo(),
		hasUndo: select( 'core/editor' ).hasEditorUndo(),
	} ) ),
	withDispatch( ( dispatch ) => ( {
		redo: dispatch( 'core/editor' ).redo,
		undo: dispatch( 'core/editor' ).undo,
		clearSelectedBlock: dispatch( 'core/editor' ).clearSelectedBlock,
	} ) ),
] )( BlockToolbar );
