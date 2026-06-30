/**
 * WordPress dependencies
 */
import { resolveSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

export const route = {
	title: () => __( 'Site Identity' ),
	canvas: () => ( {
		isPreview: true,
	} ),
	loader: async () => {
		await resolveSelect( coreStore ).getEntityRecord( 'root', 'site' );
	},
};
