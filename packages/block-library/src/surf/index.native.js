/**
 * External dependencies
 */
import { Text } from 'react-native';

// The block name and configuration object are typically defined in a directory
// for that block:
export const name = 'core/surf';

export const settings = {
	title: 'Surf',
	category: 'common',
	description: 'Add surf conditions.',
	edit: () => <Text>Hello world!</Text>,
	save: () => <span>Hello world!</span>,
};