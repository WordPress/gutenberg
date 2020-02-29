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

// we can use information from block.json in our block configuration
// (the metadata object is merged with settings in registerBlock)
const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Surf' ),
	description: __( 'Add surf conditions.' ),
	edit: () => <Text>Hello world!</Text>,
	save: () => <span>Hello world!</span>,
	icon: <Dashicon icon="palmtree" />,
};