/** @format */

import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import PlainText from '../../plain-text';

export function edit( { attributes, setAttributes, style } ) {
	return (
		<View>
			<PlainText
				value={ attributes.content }
				style={ style }
				multiline={ true }
				underlineColorAndroid="transparent"
				onChange={ content => setAttributes( { content } ) }
				placeholder={ __( 'Write code…' ) }
				aria-label={ __( 'Code' ) }
			/>
		</View>
	);
}

