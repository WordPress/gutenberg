/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import type { Action } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import type { TaxonomyFormData } from '../types';

const toggleActiveAction: Action< TaxonomyFormData > = {
	id: 'toggle-active',
	label: ( items: TaxonomyFormData[] ) =>
		items.every( ( i ) => i.status === 'publish' )
			? __( 'Deactivate' )
			: __( 'Activate' ),
	async callback( items, { registry } ) {
		const { saveEntityRecord } = registry.dispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			registry.dispatch( noticesStore );
		const nextStatus = items.every( ( i ) => i.status === 'publish' )
			? 'draft'
			: 'publish';
		try {
			for ( const item of items ) {
				if ( item.id === undefined ) {
					continue;
				}
				await saveEntityRecord(
					'postType',
					'wp_user_taxonomy',
					{ id: item.id, status: nextStatus },
					{ throwOnError: true }
				);
			}
			createSuccessNotice(
				nextStatus === 'publish'
					? __( 'Taxonomy activated.' )
					: __( 'Taxonomy deactivated.' ),
				{ type: 'snackbar' }
			);
		} catch ( error: any ) {
			createErrorNotice(
				error?.message && error?.code !== 'unknown_error'
					? error.message
					: __( 'Failed to update taxonomy status.' ),
				{ type: 'snackbar' }
			);
		}
	},
};

export default toggleActiveAction;
