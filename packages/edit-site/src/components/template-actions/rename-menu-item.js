/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import {
	Button,
	MenuItem,
	Modal,
	TextControl,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import {
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_TYPES,
	TEMPLATE_ORIGINS,
	POST_TYPE_LABELS,
} from '../../utils/constants';

export default function RenameMenuItem( { postType, postId, onClose } ) {
	const record = useSelect(
		( select ) =>
			select( coreStore ).getEntityRecord( 'postType', postType, postId ),
		[ postType, postId ]
	);
	const [ editedTitle, setEditedTitle ] = useState( '' );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const {
		editEntityRecord,
		__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
	} = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const isTemplate = record?.type === TEMPLATE_POST_TYPE;
	const isTemplatePart = record?.type === TEMPLATE_PART_POST_TYPE;
	const isUserPattern = record?.type === PATTERN_TYPES.user;

	if (
		( isTemplate || isTemplatePart ) &&
		record?.source !== TEMPLATE_ORIGINS.custom &&
		! isUserPattern
	) {
		return null;
	}

	async function onRename( event ) {
		event.preventDefault();

		try {
			await editEntityRecord( 'postType', record.type, record.id, {
				title: editedTitle,
			} );

			// Update state before saving rerenders the list.
			setEditedTitle( '' );
			setIsModalOpen( false );
			onClose();

			// Persist edited entity.
			await saveSpecifiedEntityEdits(
				'postType',
				postType,
				postId,
				[ 'title' ], // Only save title to avoid persisting other edits.
				{
					throwOnError: true,
				}
			);

			createSuccessNotice(
				sprintf(
					// translators: %1$s is a post type label, e.g., Template, Template Part or Pattern. %2$s is the new title.
					__( '%1$s renamed to "%2$s".' ),
					POST_TYPE_LABELS[ postType ] ??
						POST_TYPE_LABELS.wp_template,
					editedTitle
				),
				{
					type: 'snackbar',
					id: 'template-rename-success',
				}
			);
		} catch ( error ) {
			const fallbackErrorMessage = sprintf(
				// translators: %s is a post type label, e.g., Template, Template Part or Pattern.
				__( 'An error occurred while renaming the %s.' ),
				POST_TYPE_LABELS[ postType ] ?? POST_TYPE_LABELS.wp_template
			);
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: fallbackErrorMessage;

			createErrorNotice( errorMessage, { type: 'snackbar' } );
		}
	}

	return (
		<>
			<MenuItem
				onClick={ () => {
					setIsModalOpen( true );
					setEditedTitle(
						decodeEntities(
							record?.title?.rendered || record?.title?.raw
						)
					);
				} }
			>
				{ __( 'Rename' ) }
			</MenuItem>
			{ isModalOpen && (
				<Modal
					title={ __( 'Rename' ) }
					onRequestClose={ () => {
						setIsModalOpen( false );
						onClose();
					} }
					overlayClassName="edit-site-list__rename-modal"
				>
					<form onSubmit={ onRename }>
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
									__next40pxDefaultSize
									variant="tertiary"
									onClick={ () => {
										setIsModalOpen( false );
										onClose();
									} }
								>
									{ __( 'Cancel' ) }
								</Button>

								<Button
									__next40pxDefaultSize
									variant="primary"
									type="submit"
								>
									{ __( 'Save' ) }
								</Button>
							</HStack>
						</VStack>
					</form>
				</Modal>
			) }
		</>
	);
}
