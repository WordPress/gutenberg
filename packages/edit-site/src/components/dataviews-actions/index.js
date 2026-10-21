import { __ } from '@wordpress/i18n';
import { drawerRight } from '@wordpress/icons';
import { useCallback, useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

/**
 * Returns the `onActionPerformed` handler of the lists of the site editor,
 * which opens the editor when the "Edit" action of `@wordpress/core-actions`
 * is performed: the action does not navigate by itself.
 *
 * @return {(actionId: string, items: Object[]) => void} The handler to pass to
 *                                                      `usePostActions`.
 */
export const useEditPostHandler = () => {
	const history = useHistory();
	return useCallback(
		( actionId, items ) => {
			if ( actionId === 'edit-post' ) {
				const post = items[ 0 ];
				history.navigate( `/${ post.type }/${ post.id }?canvas=edit` );
			}
		},
		[ history ]
	);
};

export const useQuickEditPostAction = () => {
	const history = useHistory();
	const { path, query } = useLocation();
	return useMemo(
		() => ( {
			id: 'quick-edit',
			label: ( items ) =>
				items.length > 1 ? __( 'Bulk edit' ) : __( 'Quick edit' ),
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
