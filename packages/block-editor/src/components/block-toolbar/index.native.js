/**
 * External dependencies
 */
import { View, ScrollView, Keyboard } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { Toolbar, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './style.scss';
import BlockFormatControls from '../block-format-controls';
import BlockControls from '../block-controls';

export class BlockToolbar extends Component {
	constructor( ...args ) {
		super( ...args );

		this.onKeyboardHide = this.onKeyboardHide.bind( this );
	}

	onKeyboardHide() {
		Keyboard.dismiss();
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
			<View style={ styles.container }>
				<ScrollView
					horizontal={ true }
					showsHorizontalScrollIndicator={ false }
					keyboardShouldPersistTaps={ 'always' }
					alwaysBounceHorizontal={ false }
					contentContainerStyle={ styles.scrollableContent }
				>
					<Toolbar>
						<ToolbarButton
							label={ __( 'Add block' ) }
							icon="insert"
							onClick={ onInsertClick }
						/>
						<ToolbarButton
							label={ __( 'Undo' ) }
							icon="undo"
							isDisabled={ ! hasUndo }
							onClick={ undo }
						/>
						<ToolbarButton
							label={ __( 'Redo' ) }
							icon="redo"
							isDisabled={ ! hasRedo }
							onClick={ redo }
						/>
					</Toolbar>
					<BlockControls.Slot />
					<BlockFormatControls.Slot />
				</ScrollView>
				{ showKeyboardHideButton &&
				( <Toolbar passedStyle={ styles.keyboardHideContainer }>
					<ToolbarButton
						icon="keyboard-hide"
						onClick={ this.onKeyboardHide }
					/>
				</Toolbar> ) }
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
	} ) ),
] )( BlockToolbar );
