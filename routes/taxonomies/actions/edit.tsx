/**
 * WordPress dependencies
 */
import type { Action } from '@wordpress/dataviews';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { useNavigate } from '@wordpress/route';
import type { TaxonomyFormData } from '@wordpress/user-taxonomies';

export function useEditTaxonomyAction(): Action< TaxonomyFormData > {
	const navigate = useNavigate();
	return {
		id: 'edit-taxonomy',
		label: __( 'Edit' ),
		icon: pencil,
		callback: ( items: TaxonomyFormData[] ) => {
			const item = items[ 0 ];
			if ( item?.id === undefined ) {
				return;
			}
			navigate( {
				to: `/edit/${ item.id }`,
			} );
		},
	};
}
