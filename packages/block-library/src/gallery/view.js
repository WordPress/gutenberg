/**
 * WordPress dependencies
 */
import { store } from '@wordpress/interactivity';

store(
	'core/gallery',
	{
		callbacks: {
			init() {},
		},
	},
	{
		lock: false,
	}
);
