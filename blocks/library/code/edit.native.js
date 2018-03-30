/** @format */

import { View } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '../../../i18n';

/**
 * Internal dependencies
 */
import PlainText from '../../plain-text';

export function edit( { attributes, setAttributes, className } ) {
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
}

