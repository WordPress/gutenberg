import React, { Component } from 'react';
import { View } from 'react-native';
import { BlockFormatControls, BlockControls } from '@wordpress/editor';

export default class BlockToolbar extends Component {
	render() {
		return (
			<View style={ { height: 50, backgroundColor: '#DCDCDC', flexDirection: 'row' } }>
				<BlockControls.Slot />
				<BlockFormatControls.Slot />
			</View>
		);
	}
}
