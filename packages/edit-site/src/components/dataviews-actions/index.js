import { useCallback } from '@wordpress/element';
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

/**
 * Returns the `onActionPerformed` handler of the pages list of the site editor,
 * which opens the quick edit form when the "Quick edit" action of
 * `@wordpress/core-actions` is performed: the action does not open it by
 * itself.
 *
 * @return {(actionId: string, items: Object[]) => void} The handler to pass to
 *                                                      `usePostActions`.
 */
export const useQuickEditPostHandler = () => {
	const history = useHistory();
	const { path, query } = useLocation();
	return useCallback(
		( actionId, items ) => {
			if ( actionId === 'quick-edit' ) {
				history.navigate(
					addQueryArgs( path, {
						...query,
						quickEdit: true,
						postId: items.map( ( item ) => item.id ).join( ',' ),
					} )
				);
			}
		},
		[ history, path, query ]
	);
};
