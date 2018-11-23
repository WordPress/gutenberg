/**
 * @format
 * @flow
 */

import React, { Component } from 'react';
import { View } from 'react-native';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { Toolbar, ToolbarButton } from '@wordpress/components';
import { BlockFormatControls, BlockControls } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

import styles from './block-toolbar.scss';

type PropsType = {
	onInsertClick: void => void,
	onKeyboardHide: void => void,
	showKeyboardHideButton: boolean,
	hasRedo: boolean,
	hasUndo: boolean,
	redo: void => void,
	undo: void => void,
};

export class BlockToolbar extends Component<PropsType> {
	render() {
		const {
			hasRedo,
			hasUndo,
			redo,
			undo,
			onInsertClick,
			onKeyboardHide,
			showKeyboardHideButton,
		} = this.props;

		return (
			<View style={ styles.container }>
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
					<ToolbarButton
						label={ __( 'Keyboard hide' ) }
						icon="arrow-down"
						onClick={ onKeyboardHide }
					/>
				</Toolbar> ) }
				<BlockControls.Slot />
				<BlockFormatControls.Slot />
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
