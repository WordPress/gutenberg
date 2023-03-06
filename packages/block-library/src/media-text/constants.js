/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

export const DEFAULT_MEDIA_SIZE_SLUG = 'full';
export const WIDTH_CONSTRAINT_PERCENTAGE = 15;
export const LINK_DESTINATION_MEDIA = 'media';
export const LINK_DESTINATION_ATTACHMENT = 'attachment';
export const TEMPLATE = [
	[
		'core/paragraph',
		{
			placeholder: _x( 'Content…', 'content placeholder' ),
		},
	],
];
