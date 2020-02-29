/**
 * External dependencies
 */
import { Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const name = 'core/surf';

export const settings = {
	title: __( 'Surf' ), // let's make sure our user facing strings are translated
	category: 'common',
	description: __( 'Add surf conditions.' ),
	edit: () => <Text>Hello world!</Text>,
	save: () => <span>Hello world!</span>,
};