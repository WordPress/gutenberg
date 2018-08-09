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

	edit( { attributes }) {

		let blockName = attributes.title.charAt(0).toUpperCase() + attributes.title.slice(1);

		return (
			<View style={ styles.unsupportedBlock }>
				<View style={ styles.unsupportedBlockImagePlaceholder }></View>
				<Text style={ styles.unsupportedBlockName }>{ blockName }</Text>
				<Text style={ styles.unsupportedBlockMessage }>Unsupported</Text>
			</View>
		);
	},

	save( { attributes } ) {
		return <RawHTML>{ attributes.content }</RawHTML>;
	},
};
