/** @format */

import React from 'react';
import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '../../../i18n';

/**
 * Internal dependencies
 */
// import './editor.scss';
import PlainText from '../../plain-text';
import { createBlock } from '../../api';

export const name = 'core/code';

export const settings = {
	title: __( 'Code' ),

	description: __( 'The code block maintains spaces and tabs, great for showing code snippets.' ),

	icon: 'editor-code',

	category: 'formatting',

	attributes: {
		content: {
			type: 'string',
			source: 'property',
			selector: 'code',
			property: 'textContent',
		},
	},

	supports: {
		html: false,
	},

	transforms: {
		from: [
			{
				type: 'pattern',
				trigger: 'enter',
				regExp: /^```$/,
				transform: () => createBlock( 'core/code' ),
			},
			{
				type: 'raw',
				isMatch: node =>
					node.nodeName === 'PRE' &&
					node.children.length === 1 &&
					node.firstChild.nodeName === 'CODE',
			},
		],
	},

	edit( { attributes, setAttributes, className } ) {
		return (
			<View className={ className }>
				<PlainText
					value={ attributes.content }
					multiline={ true }
					underlineColorAndroid="transparent"
					onChange={ content => setAttributes( { content } ) }
					placeholder={ __( 'Write code…' ) }
					aria-label={ __( 'Code' ) }
				/>
			</View>
		);
	},

	save( { attributes } ) {
		return (
			<pre>
				<code>{ attributes.content }</code>
			</pre>
		);
	},
};
