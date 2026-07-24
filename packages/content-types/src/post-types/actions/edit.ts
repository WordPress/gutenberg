/**
 * WordPress dependencies
 */
import type { Action } from '@wordpress/dataviews';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';

/**
 * Internal dependencies
 */
import type { PostTypeFormData } from '../types';
import { POST_TYPES_PATH } from '../../constants';

export function useEditPostTypeAction(): Action< PostTypeFormData > {
	const navigate = useNavigate();
	return useMemo(
		() => ( {
			id: 'edit-post-type',
			label: __( 'Edit' ),
			callback: ( items: PostTypeFormData[] ) => {
				const item = items[ 0 ];
				if ( item?.id === undefined ) {
					return;
				}
				navigate( {
					to: `${ POST_TYPES_PATH }/${ item.id }`,
				} );
			},
		} ),
		[ navigate ]
	);
}
