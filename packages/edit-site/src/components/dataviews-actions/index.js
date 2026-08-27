import { __ } from '@wordpress/i18n';
import { pencil, drawerRight } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { viewPostRevisions } from '@wordpress/fields';
import { addQueryArgs } from '@wordpress/url';
import { PATTERN_TYPES } from '../../utils/constants';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );
const { usePostActions } = unlock( editorPrivateApis );

export const useSetActiveTemplateAction = () => {
	const activeTheme = useSelect( ( select ) =>
		select( coreStore ).getCurrentTheme()
	);
	const { getEntityRecord } = useSelect( coreStore );
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );
	return useMemo(
		() => ( {
			id: 'set-active-template',
			label( items ) {
				return items.some( ( item ) => item._isActive )
					? __( 'Deactivate' )
					: __( 'Activate' );
			},
			isPrimary: true,
			icon: pencil,
			isEligible( item ) {
				if ( item.theme !== activeTheme.stylesheet ) {
					return false;
				}

				// If it's not a created template but a registered template,
				// only allow activating (so when it's inactive).
				if ( typeof item.id !== 'number' ) {
					return item._isActive === false;
				}

				return true;
			},
			async callback( items ) {
				const deactivate = items.some( ( item ) => item._isActive );
				// current active templates
				const activeTemplates = {
					...( ( await getEntityRecord( 'root', 'site' )
						.active_templates ) ?? {} ),
				};
				for ( const item of items ) {
					if ( deactivate ) {
						delete activeTemplates[ item.slug ];
					} else {
						activeTemplates[ item.slug ] = item.id;
					}
				}
				await editEntityRecord( 'root', 'site', undefined, {
					active_templates: activeTemplates,
				} );
				await saveEditedEntityRecord( 'root', 'site' );
			},
		} ),
		[
			editEntityRecord,
			saveEditedEntityRecord,
			getEntityRecord,
			activeTheme,
		]
	);
};

export const useEditPostAction = () => {
	const history = useHistory();
	return useMemo(
		() => ( {
			id: 'edit-post',
			label: __( 'Edit' ),
			icon: pencil,
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

/**
 * Returns the actions registered for a post type, with the site editor specific
 * overrides applied.
 *
 * @param {Object} options The options passed to `usePostActions`.
 * @return {Array} The actions.
 */
export const useSiteEditorPostActions = ( options ) => {
	const postTypeActions = usePostActions( options );
	const history = useHistory();
	return useMemo(
		() =>
			postTypeActions.map( ( action ) =>
				action.id === viewPostRevisions.id
					? {
							...action,
							callback( items ) {
								const post = items[ 0 ];
								history.navigate(
									addQueryArgs(
										`/${ post.type }/${ post.id }`,
										{
											canvas: 'edit',
											revision:
												post._links?.[
													'predecessor-version'
												]?.[ 0 ]?.id,
										}
									)
								);
							},
					  }
					: action
			),
		[ postTypeActions, history ]
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
