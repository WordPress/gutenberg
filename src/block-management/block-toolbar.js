/**
 * @format
 * @flow
 */

import React, { Component } from 'react';
import { View, ScrollView, Keyboard } from 'react-native';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { Toolbar, ToolbarButton } from '@wordpress/components';
import { BlockFormatControls, BlockControls } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import KeyboardHideButton from '../components/keyboard-hide-button';

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
					{ showKeyboardHideButton && ( <Toolbar>
						<KeyboardHideButton
							onPress={ this.onKeyboardHide }
						/>
					</Toolbar> ) }
					<BlockControls.Slot />
					<BlockFormatControls.Slot />
				</ScrollView>
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
