/**
 * @format
 * @flow
 */

/**
 * External dependencies
 */
import React, { Component } from 'react';
import { View, ScrollView, Keyboard } from 'react-native';

/**
 * WordPress dependencies
 */
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { Toolbar, ToolbarButton, Dashicon } from '@wordpress/components';
import { BlockFormatControls, BlockControls } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import styles from './block-toolbar.scss';

type PropsType = {
	onInsertClick: void => void,
	showKeyboardHideButton: boolean,
	hasRedo: boolean,
	hasUndo: boolean,
	redo: void => void,
	undo: void => void,
};

export class BlockToolbar extends Component<PropsType> {
	onKeyboardHide = () => {
		Keyboard.dismiss();
	};

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
							icon={ ( <Dashicon icon="plus-alt" style={ styles.addBlockButton } color={ styles.addBlockButton.color } /> ) }
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
