/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { pencil, drawerRight } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { PATTERN_TYPES } from '../../utils/constants';
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

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
