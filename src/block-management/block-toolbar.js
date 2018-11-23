/**
 * @format
 * @flow
 */

import React, { Component } from 'react';
import { View } from 'react-native';
import { Toolbar, ToolbarButton } from '@wordpress/components';
import { BlockFormatControls, BlockControls } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

import styles from './block-toolbar.scss';

type PropsType = {
	onInsertClick: void => void,
	onKeyboardHide: void => void,
	showKeyboardHideButton: boolean,
};

export default class BlockToolbar extends Component<PropsType> {
	render() {
		return (
			<View style={ styles.container }>
				<Toolbar>
					<ToolbarButton
						label={ __( 'Add block' ) }
						icon="insert"
						onClick={ this.props.onInsertClick }
					/>
				</Toolbar>
				{ this.props.showKeyboardHideButton && ( <Toolbar>
					<ToolbarButton
						label={ __( 'Keyboard hide' ) }
						icon="arrow-down"
						onClick={ this.props.onKeyboardHide }
					/>
				</Toolbar> ) }
				<BlockControls.Slot />
				<BlockFormatControls.Slot />
			</View>
		);
	}
}
