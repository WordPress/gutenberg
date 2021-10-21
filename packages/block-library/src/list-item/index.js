/**
 * WordPress dependencies
 */
import { list as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { ListItem as edit } from './edit';
import { save } from './save';

export const name = 'core/list-item';

export const settings = {
	apiVersion: 2,
	category: 'text',
	description: 'Individual list item in a list',
	edit,
	icon,
	name: 'core/list-item',
	parent: [ 'core/list' ],
	title: 'List Item',
	save,
};
