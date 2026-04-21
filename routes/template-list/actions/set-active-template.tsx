/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Action } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import type { Template } from '../types';

/**
 * Hook to create the "Set Active Template" action.
 * This action allows users to activate or deactivate templates.
 *
 * @return {Action<Template>} The set active template action.
 */
export function useSetActiveTemplateAction(): Action< Template > {
	const activeTheme = useSelect( ( select ) =>
		select( coreStore ).getCurrentTheme()
	);
	const { getEntityRecord } = useSelect( coreStore );
	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );

	return useMemo(
		() => ( {
			id: 'set-active-template',
			label( items: Template[] ) {
				return items.some( ( item ) => item._isActive )
					? __( 'Deactivate' )
					: __( 'Activate' );
			},
			isPrimary: true,
			icon: pencil,
			isEligible( item: Template ) {
				if ( ! activeTheme ) {
					return false;
				}

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
			async callback( items: Template[] ) {
				const deactivate = items.some( ( item ) => item._isActive );
				// current active templates
				const activeTemplates = {
					...( ( await getEntityRecord( 'root', 'site' ) )
						?.active_templates ?? {} ),
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
}
