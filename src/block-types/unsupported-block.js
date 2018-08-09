/**
 * @format
 * @flow
 */

import React from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import Toolbar from '../block-management/toolbar';
import styles from '../block-management/block-holder.scss';

// Gutenberg imports
import { __ } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';

export const name = 'gmobile/unsupported';

export const settings = {
	title: __( 'Unsupported Block' ),

	description: __( 'Unsupported block type.' ),

	icon: 'editor-code',

	category: 'formatting',

	attributes: {
		content: {
			type: 'string',
			source: 'html',
		},
	},

	supports: {
		html: false,
	},

	transforms: {
	},

	edit() {
		return (
			<View style={ styles.blockHolder }>
				<View style={ styles.blockTitle }>
					<Text>Unsupported BlockType</Text>
				</View>
				<View style={{backgroundColor: 'red', flex: 0.5}} />
			</View>
		);
	},

	save( { attributes } ) {
		return <RawHTML>{ attributes.content }</RawHTML>;
	},
};
