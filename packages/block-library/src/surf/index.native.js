/**
 * External dependencies
 */
import { Text } from 'react-native';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon } from '@wordpress/components';

/**
 * Internal dependencies
 */
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Surf' ),
	description: __( 'Add surf conditions.' ),
	edit: () => <Text>Hello world!</Text>, // we can extract these functions to
	save: () => <span>Hello world!</span>, // their own files
	icon: <Dashicon icon="palmtree" />,
};