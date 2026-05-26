/**
 * WordPress dependencies
 */
import { wordpress } from '@wordpress/icons';

/**
 * Widget type definition
 */
export default {
	name: 'core/hello-world',
	title: 'Hello World',
	icon: wordpress,
	attributes: [
		{
			id: 'message',
			label: 'Message',
			type: 'text',
		},
	],
	example: {
		attributes: {
			message: 'Hello World',
		},
	},
};
