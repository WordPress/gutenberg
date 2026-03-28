/**
 * WordPress dependencies
 */
import { useNavigate, useSearch } from '@wordpress/route';
import type { Action } from '@wordpress/dataviews';
import type { Post } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';

export function useEditNavigationAction(): Action< Post > {
	const navigate = useNavigate();
	const searchParams = useSearch( { strict: false } );

	return {
		id: 'edit',
		label: __( 'Edit' ),
		isPrimary: true,
		icon: pencil,
		callback: ( items: Post[] ) => {
			const item = items[ 0 ];
			navigate( {
				search: {
					...searchParams,
					editId: item.id,
				},
			} );
		},
		isEligible( item: Post ) {
			return (
				item.type === 'wp_navigation' &&
				String( item.status ) !== 'trash'
			);
		},
	};
}
