/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

export const INPUT_TYPES = [
	{
		key: 'text',
		name: __( 'Text' ),
	},
	{
		key: 'textarea',
		name: __( 'Textarea' ),
	},
	{
		key: 'checkbox',
		name: __( 'Checkbox' ),
	},
	{
		key: 'email',
		name: __( 'Email' ),
	},
	{
		key: 'url',
		name: __( 'URL' ),
	},
	{
		key: 'tel',
		name: __( 'Telephone' ),
	},
	{
		key: 'number',
		name: __( 'Number' ),
	},
	{
		key: 'datetime-local',
		name: __( 'Date and time' ),
	},
	{
		key: 'submit',
		name: __( 'Submit' ),
	},
];
