/**
 * WordPress dependencies
 */
import { backup } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import isTemplateRevertable from '../../utils/is-template-revertable';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';

export function useResetTemplateAction() {
	const { revertTemplate } = useDispatch( editSiteStore );
	const { saveEditedEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	return useMemo(
		() => ( {
			id: 'reset-template',
			label: __( 'Reset template' ),
			isPrimary: true,
			icon: backup,
			isEligible: isTemplateRevertable,
			async perform( template ) {
				try {
					await revertTemplate( template, { allowUndo: false } );
					await saveEditedEntityRecord(
						'postType',
						template.type,
						template.id
					);

					createSuccessNotice(
						sprintf(
							/* translators: The template/part's name. */
							__( '"%s" reverted.' ),
							decodeEntities( template.title.rendered )
						),
						{
							type: 'snackbar',
							id: 'edit-site-template-reverted',
						}
					);
				} catch ( error ) {
					const fallbackErrorMessage =
						template.type === TEMPLATE_POST_TYPE
							? __(
									'An error occurred while reverting the template.'
							  )
							: __(
									'An error occurred while reverting the template part.'
							  );
					const errorMessage =
						error.message && error.code !== 'unknown_error'
							? error.message
							: fallbackErrorMessage;

					createErrorNotice( errorMessage, { type: 'snackbar' } );
				}
			},
		} ),
		[
			createErrorNotice,
			createSuccessNotice,
			revertTemplate,
			saveEditedEntityRecord,
		]
	);
}
