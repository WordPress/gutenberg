/**
 * WordPress dependencies
 */
import {
	Button,
	TextControl,
	Notice,
	Modal,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { decodeEntities } from '@wordpress/html-entities';
import { useState } from '@wordpress/element';
import { plus } from '@wordpress/icons';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Component for creating new pages from within the Page List block.
 *
 * @param {Object} props              Component props.
 * @param {number} props.parentPageID The parent page ID for the new page.
 */
export function PageCreatorAppender( { parentPageID } ) {
	const [ isCreating, setIsCreating ] = useState( false );
	const [ title, setTitle ] = useState( '' );

	// Check if the title is valid for submission
	const isTitleValid = title.trim().length > 0;

	// Get the last created entity record (without ID) to track creation state
	const { lastError, isSaving } = useSelect(
		( select ) => ( {
			lastError: select( coreStore ).getLastEntitySaveError(
				'postType',
				'page'
			),
			isSaving: select( coreStore ).isSavingEntityRecord(
				'postType',
				'page'
			),
		} ),
		[]
	);

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	async function createPage( event ) {
		event.preventDefault();
		if ( isSaving || ! isTitleValid ) {
			return;
		}

		try {
			const pageData = {
				title,
				status: 'publish',
			};

			// If there's a parent page ID, set it
			if ( parentPageID ) {
				pageData.parent = parentPageID;
			}

			const savedRecord = await saveEntityRecord(
				'postType',
				'page',
				pageData,
				{ throwOnError: true }
			);

			if ( savedRecord ) {
				// Show success notice
				createSuccessNotice(
					sprintf(
						// translators: %s: the title of the new page.
						__( 'Page "%s" created successfully.' ),
						decodeEntities( savedRecord.title.rendered )
					),
					{
						type: 'snackbar',
						id: 'page-created-success',
					}
				);

				// Reset the form
				setTitle( '' );
				setIsCreating( false );
			}
		} catch ( error ) {
			// Show error notice
			createErrorNotice(
				__( 'Failed to create page. Please try again.' ),
				{
					type: 'snackbar',
					id: 'page-created-error',
				}
			);
		}
	}

	const isSubmitDisabled = isSaving || ! isTitleValid;

	return (
		<>
			<div className="page-list-appender">
				<Button
					__next40pxDefaultSize
					icon={ plus }
					onClick={ () => setIsCreating( true ) }
					variant="tertiary"
					className="page-list-appender__button"
				>
					{ __( 'Add page' ) }
				</Button>
				<InnerBlocks.ButtonBlockAppender />
			</div>

			{ isCreating && (
				<Modal
					title={ __( 'Create new page' ) }
					onRequestClose={ () => {
						setIsCreating( false );
						setTitle( '' );
					} }
					size="small"
				>
					<form onSubmit={ createPage }>
						<VStack spacing={ 4 }>
							<p>
								{ __(
									'Create a new page to add to your Page List.'
								) }
							</p>

							<TextControl
								__next40pxDefaultSize
								label={ __( 'Page title' ) }
								onChange={ setTitle }
								placeholder={ __( 'Enter page title' ) }
								value={ title }
							/>

							{ lastError && (
								<Notice status="error" isDismissible={ false }>
									{ lastError.message }
								</Notice>
							) }

							<HStack spacing={ 2 } justify="flex-end">
								<Button
									__next40pxDefaultSize
									variant="tertiary"
									onClick={ () => {
										setIsCreating( false );
										setTitle( '' );
									} }
									disabled={ isSaving }
									accessibleWhenDisabled
								>
									{ __( 'Cancel' ) }
								</Button>
								<Button
									__next40pxDefaultSize
									variant="primary"
									type="submit"
									isBusy={ isSaving }
									aria-disabled={ isSubmitDisabled }
								>
									{ __( 'Create page' ) }
								</Button>
							</HStack>
						</VStack>
					</form>
				</Modal>
			) }
		</>
	);
}
