/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { audio } from '@wordpress/icons';

/**
 * Widget type definition
 */
export default {
	name: 'core/hello-dolly',
	title: __( 'Hello Dolly' ),
	description: __(
		'This is not just a widget, it symbolizes the hope and enthusiasm of an entire generation summed up in two words sung most famously by Louis Armstrong: Hello, Dolly. When activated you will randomly see a lyric from <cite>Hello, Dolly</cite> in the dahboard.'
	),
	icon: audio,
};
