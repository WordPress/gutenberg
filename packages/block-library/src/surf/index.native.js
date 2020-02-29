/**
 * External dependencies
 */
import { Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';

export const name = 'core/surf';

export const settings = {
	title: __( 'Surf' ),
	category: 'common',
	description: __( 'Add surf conditions.' ),
	edit: () => <Text>Hello world!</Text>,
	save: () => <span>Hello world!</span>,
	icon: <Dashicon icon="palmtree" />, // let's give our block a nice icon :)
};