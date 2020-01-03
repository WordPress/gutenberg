/**
 * External dependencies
 */
import { View, Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withPreferredColorScheme } from '@wordpress/compose';

/**
 * Internal dependencies
 */

/**
 * Block code style
 */

export function ShortcodeEdit( props ) {
	const { attributes } = props;

	return (
		<View>
            <Text>{ __("Shortcode") }</Text>
            <Text>{ attributes.text }</Text>
		</View>
	);
}

export default withPreferredColorScheme( ShortcodeEdit );
