/**
 * @format
 * @flow
 */

import React from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import RCTAztecView from 'react-native-aztec';
import type { BlockType } from '../../store/';

type PropsType = BlockType & {
	onChange: ( clientId: string, attributes: mixed ) => void,
	onToolbarButtonPressed: ( button: number, clientId: string ) => void,
	onBlockHolderPressed: ( clientId: string ) => void,
};

type StateType = {
	selected: boolean,
	focused: boolean,
};

// Styles
import styles from '../../block-management/block-holder.scss';

// Gutenberg imports
import { Component } from '@wordpress/element';
import { getBlockType } from '@wordpress/blocks';
import { getUnknownTypeHandlerName } from '@wordpress/blocks';

export default class UnsupportedBlockEdit extends React.Component<PropsType, StateType> {
	constructor( props: PropsType ) {
		super( props );
	}

	render() {
		return (
			<View style={ styles.unsupportedBlock }>
				<Text style={ styles.unsupportedBlockMessage }>Unsupported</Text>
			</View>
		);
	}
}
