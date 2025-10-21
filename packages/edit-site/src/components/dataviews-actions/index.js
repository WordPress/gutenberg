/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { PATTERN_TYPES } from '../../utils/constants';
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

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
				return (
					! item._isCustom &&
					! ( item.slug === 'index' && item.source === 'theme' ) &&
					item.theme === activeTheme.stylesheet
				);
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
						if ( item.source === 'theme' ) {
							activeTemplates[ item.slug ] = false;
						} else {
							delete activeTemplates[ item.slug ];
						}
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
			isPrimary: true,
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
