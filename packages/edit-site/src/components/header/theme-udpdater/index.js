/**
 * External dependencies
 */
import { filter, some } from 'lodash';

/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import {
	__experimentalUseEntityRecords as useEntityRecords,
	store as coreStore,
} from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import isTemplateRevertable from '../../../utils/is-template-revertable';

export default function ThemeUpdater() {
	const { enableThemeSaving } = useSelect(
		( select ) => ( {
			enableThemeSaving: select( editSiteStore ).getSettings()
				.enableThemeSaving,
		} ),
		[]
	);

	const { createErrorNotice, createInfoNotice } = useDispatch( noticesStore );
	const { revertTemplate } = useDispatch( editSiteStore );

	const {
		records: templates,
		isResolving: isTemplateListLoading,
	} = useEntityRecords( 'postType', 'wp_template', {
		per_page: -1,
	} );

	const {
		records: templateParts,
		isResolving: isTemplatePartListLoading,
	} = useEntityRecords( 'postType', 'wp_template_part', {
		per_page: -1,
	} );

	const { isDirty, isSaving } = useSelect( ( select ) => {
		const {
			__experimentalGetDirtyEntityRecords,
			isSavingEntityRecord,
		} = select( coreStore );
		const dirtyEntityRecords = __experimentalGetDirtyEntityRecords();
		return {
			isDirty: dirtyEntityRecords.length > 0,
			isSaving: some( dirtyEntityRecords, ( record ) =>
				isSavingEntityRecord( record.kind, record.name, record.key )
			),
		};
	}, [] );

	const customSourceFilter = ( tpl ) => tpl.source === 'custom';
	const customTemplates = filter( templates, customSourceFilter );
	const customTemplateParts = filter( templateParts, customSourceFilter );

	const unModifiedTheme =
		! customTemplates.length && ! customTemplateParts.length;
	const isLoading = isTemplateListLoading || isTemplatePartListLoading;

	if (
		! enableThemeSaving ||
		isLoading ||
		unModifiedTheme ||
		isDirty ||
		isSaving
	) {
		return null;
	}

	const handleUpdateTheme = async () => {
		try {
			await apiFetch( {
				path: '/wp-block-editor/v1/export/export_to_theme_files',
			} );

			const revertTemplateOrPart = ( name ) => {
				if ( isTemplateRevertable( name ) ) {
					revertTemplate( name );
				}
			};
			customTemplates.forEach( revertTemplateOrPart );
			customTemplateParts.forEach( revertTemplateOrPart );

			createInfoNotice( __( 'Customisations exported to theme files' ), {
				speak: true,
				type: 'snackbar',
			} );
		} catch ( errorResponse ) {
			let error = {};
			try {
				error = await errorResponse.json();
			} catch ( e ) {}
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the site' );
			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	};

	return (
		<Button onClick={ handleUpdateTheme } variant="tertiary">
			{ __( 'Update theme' ) }
		</Button>
	);
}
