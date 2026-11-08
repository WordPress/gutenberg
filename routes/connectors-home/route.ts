/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { resolveSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

export const route = {
	title: () => __( 'Connectors' ),
	loader: async () => {
		await resolveSelect( coreStore ).canUser( 'create', {
			kind: 'root',
			name: 'plugin',
		} );
	},
};
