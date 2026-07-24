/**
 * WordPress dependencies
 */
import { wordpress } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

type HelloWorldWidgetAttributes = {
	message?: string;
};

/**
 * Widget type definition
 */
export default {
	name: 'core/hello-world',
	icon: wordpress,
	attributes: [
		{
			id: 'message',
			label: 'Message',
			type: 'text',
		},
	] satisfies WidgetAttributeField< HelloWorldWidgetAttributes >[],
	example: {
		attributes: {
			message: 'Hello World',
		},
	},
};
