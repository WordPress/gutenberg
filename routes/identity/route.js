/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';

export const route = {
	title: () => _x( 'Identity', 'site identity' ),
	async canvas() {
		return {
			isPreview: true,
		};
	},
};
