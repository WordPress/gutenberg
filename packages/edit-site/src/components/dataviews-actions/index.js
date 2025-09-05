/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { edit } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { PATTERN_TYPES } from '../../utils/constants';
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export const useEditPostAction = () => {
	const history = useHistory();
	return useMemo(
		() => ( {
			id: 'edit-post',
			label: __( 'Edit' ),
			isPrimary: true,
			icon: edit,
			isEligible( post ) {
				if ( post.status === 'trash' ) {
					return false;
				}
				// It's eligible for all post types except theme patterns.
				return post.type !== PATTERN_TYPES.theme;
			},
			callback( items ) {
				const post = items[ 0 ];
				history.navigate( `/${ post.type }/${ post.id }?canvas=edit` );
			},
		} ),
		[ history ]
	);
};
