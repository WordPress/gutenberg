/**
 * WordPress dependencies
 */
import type { Action } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import type { TaxonomyFormData } from '@wordpress/user-taxonomies';

export function useEditTaxonomyAction(): Action< TaxonomyFormData > {
	const navigate = useNavigate();
	return useMemo(
		() => ( {
			id: 'edit-taxonomy',
			label: __( 'Edit' ),
			callback: ( items: TaxonomyFormData[] ) => {
				const item = items[ 0 ];
				if ( item?.id === undefined ) {
					return;
				}
				navigate( {
					to: `/edit/${ item.id }`,
				} );
			},
		} ),
		[ navigate ]
	);
}
