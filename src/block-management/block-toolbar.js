/**
 * @format
 * @flow
 */

import React, { Component } from 'react';
import { View } from 'react-native';
import { IconButton } from '@wordpress/components';
import { BlockFormatControls, BlockControls } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';

type PropsType = {
	onInsertClick: void => void,
};

export default class BlockToolbar extends Component<PropsType> {
	render() {
		return (
			<View style={ { height: 50, backgroundColor: '#DCDCDC', flexDirection: 'row' } }>
				<IconButton
					label={ __( 'Add block' ) }
					icon="insert"
					onClick={ this.props.onInsertClick }
				/>
				<BlockControls.Slot />
				<BlockFormatControls.Slot />
			</View>
		);
	}
}
