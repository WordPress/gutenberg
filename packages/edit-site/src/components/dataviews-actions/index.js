import { __ } from '@wordpress/i18n';
import { pencil, drawerRight } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';
import { useDispatch } from '@wordpress/data';
import { store as patternsStore } from '@wordpress/patterns';
import { PATTERN_TYPES } from '../../utils/constants';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

export const useEditPostAction = () => {
	const history = useHistory();
	const { customizePattern } = unlock( useDispatch( patternsStore ) );
	return useMemo(
		() => ( {
			id: 'edit-post',
			label: __( 'Edit' ),
			icon: pencil,
			isEligible( post ) {
				return post.status !== 'trash';
			},
			async callback( items ) {
				const post = items[ 0 ];
				// A registered pattern is edited through its editable copy,
				// created on first edit.
				if ( post.type === PATTERN_TYPES.theme ) {
					const customization = post.customizationId
						? { id: post.customizationId }
						: await customizePattern( post );
					history.navigate(
						`/${ PATTERN_TYPES.user }/${ customization.id }?canvas=edit`
					);
					return;
				}
				history.navigate( `/${ post.type }/${ post.id }?canvas=edit` );
			},
		} ),
		[ history, customizePattern ]
	);
};

export const useQuickEditPostAction = () => {
	const history = useHistory();
	const { path, query } = useLocation();
	return useMemo(
		() => ( {
			id: 'quick-edit',
			label: __( 'Quick Edit' ),
			icon: drawerRight,
			isPrimary: true,
			supportsBulk: true,
			isEligible( post ) {
				if ( post.status === 'trash' ) {
					return false;
				}

				return post.type === 'page';
			},
			callback( items ) {
				history.navigate(
					addQueryArgs( path, {
						...query,
						quickEdit: true,
						postId: items.map( ( item ) => item.id ).join( ',' ),
					} )
				);
			},
		} ),
		[ history, path, query ]
	);
};
