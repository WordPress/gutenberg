/**
 * WordPress dependencies
 */
import { backup, trash } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useMemo, useState } from '@wordpress/element';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';
import {
	Button,
	TextControl,
	__experimentalText as Text,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import isTemplateRevertable from '../../utils/is-template-revertable';
import isTemplateRemovable from '../../utils/is-template-removable';
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
			async callback( template ) {
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

export const deleteTemplateAction = {
	id: 'delete-template',
	label: __( 'Delete template' ),
	isPrimary: true,
	icon: trash,
	isEligible: isTemplateRemovable,
	hideModalHeader: true,
	RenderModal: ( { item: template, closeModal } ) => {
		const { removeTemplate } = useDispatch( editSiteStore );
		return (
			<VStack spacing="5">
				<Text>
					{ sprintf(
						// translators: %s: The template or template part's title.
						__( 'Are you sure you want to delete "%s"?' ),
						decodeEntities( template.title.rendered )
					) }
				</Text>
				<HStack justify="right">
					<Button variant="tertiary" onClick={ closeModal }>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ () =>
							removeTemplate( template, {
								allowUndo: false,
							} )
						}
					>
						{ __( 'Delete' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

export const renameTemplateAction = {
	id: 'rename-template',
	label: __( 'Rename' ),
	isEligible: ( template ) =>
		isTemplateRemovable( template ) && template.is_custom,
	RenderModal: ( { item: template, closeModal } ) => {
		const title = decodeEntities( template.title.rendered );
		const [ editedTitle, setEditedTitle ] = useState( title );
		const {
			editEntityRecord,
			__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
		} = useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );
		async function onTemplateRename( event ) {
			event.preventDefault();
			try {
				await editEntityRecord(
					'postType',
					template.type,
					template.id,
					{
						title: editedTitle,
					}
				);
				// Update state before saving rerenders the list.
				setEditedTitle( '' );
				closeModal();
				// Persist edited entity.
				await saveSpecifiedEntityEdits(
					'postType',
					template.type,
					template.id,
					[ 'title' ], // Only save title to avoid persisting other edits.
					{
						throwOnError: true,
					}
				);
				// TODO: this action will be reused in template parts list, so
				// let's keep this for a bit, even it's always a `template` now.
				createSuccessNotice(
					template.type === TEMPLATE_POST_TYPE
						? __( 'Template renamed.' )
						: __( 'Template part renamed.' ),
					{
						type: 'snackbar',
					}
				);
			} catch ( error ) {
				const fallbackErrorMessage =
					template.type === TEMPLATE_POST_TYPE
						? __( 'An error occurred while renaming the template.' )
						: __(
								'An error occurred while renaming the template part.'
						  );
				const errorMessage =
					error.message && error.code !== 'unknown_error'
						? error.message
						: fallbackErrorMessage;

				createErrorNotice( errorMessage, { type: 'snackbar' } );
			}
		}
		return (
			<form onSubmit={ onTemplateRename }>
				<VStack spacing="5">
					<TextControl
						__nextHasNoMarginBottom
						label={ __( 'Name' ) }
						value={ editedTitle }
						onChange={ setEditedTitle }
						required
					/>
					<HStack justify="right">
						<Button variant="tertiary" onClick={ closeModal }>
							{ __( 'Cancel' ) }
						</Button>
						<Button variant="primary" type="submit">
							{ __( 'Save' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		);
	},
};
