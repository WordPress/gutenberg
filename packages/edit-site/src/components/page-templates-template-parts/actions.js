/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
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
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';
import isTemplateRevertable from '../../utils/is-template-revertable';
import isTemplateRemovable from '../../utils/is-template-removable';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';

export const resetTemplateAction = {
	id: 'reset-template',
	label: __( 'Reset' ),
	isEligible: isTemplateRevertable,
	supportsBulk: true,
	hideModalHeader: true,
	RenderModal: ( { items, closeModal, onPerform } ) => {
		const { revertTemplate } = useDispatch( editSiteStore );
		const { saveEditedEntityRecord } = useDispatch( coreStore );
		const { createSuccessNotice, createErrorNotice } =
			useDispatch( noticesStore );
		const onConfirm = async () => {
			try {
				for ( const template of items ) {
					await revertTemplate( template, {
						allowUndo: false,
					} );
					await saveEditedEntityRecord(
						'postType',
						template.type,
						template.id
					);
				}

				createSuccessNotice(
					items.length > 1
						? sprintf(
								/* translators: The number of items. */
								__( '%s items reset.' ),
								items.length
						  )
						: sprintf(
								/* translators: The template/part's name. */
								__( '"%s" reset.' ),
								decodeEntities( items[ 0 ].title.rendered )
						  ),
					{
						type: 'snackbar',
						id: 'edit-site-template-reverted',
					}
				);
			} catch ( error ) {
				let fallbackErrorMessage;
				if ( items[ 0 ].type === TEMPLATE_POST_TYPE ) {
					fallbackErrorMessage =
						items.length === 1
							? __(
									'An error occurred while reverting the template.'
							  )
							: __(
									'An error occurred while reverting the templates.'
							  );
				} else {
					fallbackErrorMessage =
						items.length === 1
							? __(
									'An error occurred while reverting the template part.'
							  )
							: __(
									'An error occurred while reverting the template parts.'
							  );
				}
				const errorMessage =
					error.message && error.code !== 'unknown_error'
						? error.message
						: fallbackErrorMessage;

				createErrorNotice( errorMessage, { type: 'snackbar' } );
			}
		};
		return (
			<VStack spacing="5">
				<Text>
					{ __( 'Reset to default and clear all customizations?' ) }
				</Text>
				<HStack justify="right">
					<Button variant="tertiary" onClick={ closeModal }>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
							await onConfirm( items );
							onPerform?.();
							closeModal();
						} }
					>
						{ __( 'Reset' ) }
					</Button>
				</HStack>
			</VStack>
		);
	},
};

export const deleteTemplateAction = {
	id: 'delete-template',
	label: __( 'Delete' ),
	isEligible: isTemplateRemovable,
	supportsBulk: true,
	hideModalHeader: true,
	RenderModal: ( { items: templates, closeModal, onPerform } ) => {
		const { removeTemplates } = unlock( useDispatch( editSiteStore ) );
		return (
			<VStack spacing="5">
				<Text>
					{ templates.length > 1
						? sprintf(
								// translators: %d: number of items to delete.
								_n(
									'Delete %d item?',
									'Delete %d items?',
									templates.length
								),
								templates.length
						  )
						: sprintf(
								// translators: %s: The template or template part's titles
								__( 'Delete "%s"?' ),
								decodeEntities(
									templates?.[ 0 ]?.title?.rendered
								)
						  ) }
				</Text>
				<HStack justify="right">
					<Button variant="tertiary" onClick={ closeModal }>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						variant="primary"
						onClick={ async () => {
							await removeTemplates( templates, {
								allowUndo: false,
							} );
							onPerform?.();
							closeModal();
						} }
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
	isEligible: ( template ) => {
		// We can only remove templates or template parts that can be removed.
		// Additionally in the case of templates, we can only remove custom templates.
		if (
			! isTemplateRemovable( template ) ||
			( template.type === TEMPLATE_POST_TYPE && ! template.is_custom )
		) {
			return false;
		}
		return true;
	},
	RenderModal: ( { items: templates, closeModal } ) => {
		const template = templates[ 0 ];
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
						__next40pxDefaultSize
						label={ __( 'Name' ) }
						value={ editedTitle }
						onChange={ setEditedTitle }
						required
					/>
					<HStack justify="right">
						<Button
							variant="tertiary"
							onClick={ closeModal }
							__next40pxDefaultSize
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							type="submit"
							__next40pxDefaultSize
						>
							{ __( 'Save' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		);
	},
};
