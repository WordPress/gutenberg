/**
 * WordPress dependencies
 */
import { useNavigate } from '@wordpress/route';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';
import {
	Button,
	CheckboxControl,
	Modal,
	TextControl,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';

const NAVIGATION_POST_TYPE = 'wp_navigation';
const PAGE_LIST_BLOCK_CONTENT = '<!-- wp:core/page-list /-->';

export const AddNavigationModal = ( {
	closeModal,
}: {
	closeModal?: () => void;
} ) => {
	const [ menuTitle, setMenuTitle ] = useState( '' );
	const [ autoSyncWithPages, setAutoSyncWithPages ] = useState( false );
	const [ isBusy, setIsBusy ] = useState( false );
	const navigate = useNavigate();

	const { saveEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const handleConfirmAdd = async () => {
		if ( ! menuTitle || ! menuTitle.trim() ) {
			return;
		}

		const trimmedTitle = menuTitle.trim();
		setIsBusy( true );

		try {
			const savedRecord = await saveEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				{
					title: trimmedTitle,
					status: 'publish',
					...( autoSyncWithPages
						? { content: PAGE_LIST_BLOCK_CONTENT }
						: {} ),
				},
				{
					throwOnError: true,
				}
			);

			if ( savedRecord ) {
				createSuccessNotice(
					__( 'Navigation menu created successfully.' ),
					{
						type: 'snackbar',
					}
				);

				// Navigate to the newly created navigation menu
				navigate( {
					to: `/navigation/edit/${ encodeURIComponent(
						savedRecord.id
					) }`,
				} );
			}
		} catch ( error ) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			createErrorNotice(
				sprintf(
					/* translators: %s: error message describing why the navigation menu could not be created. */
					__( 'Unable to create navigation menu: %s' ),
					errorMessage
				),
				{
					type: 'snackbar',
				}
			);
		}

		setIsBusy( false );
		closeModal?.();
	};

	return (
		<Modal
			title={ __( 'Add New Navigation Menu' ) }
			onRequestClose={ () => closeModal?.() }
			focusOnMount="firstContentElement"
			size="small"
		>
			<form
				onSubmit={ ( event ) => {
					event.preventDefault();
					handleConfirmAdd();
				} }
			>
				<VStack spacing={ 4 }>
					<TextControl
						autoComplete="off"
						value={ menuTitle }
						onChange={ setMenuTitle }
						label={ __( 'Name' ) }
						placeholder={ __( 'Enter menu name' ) }
						disabled={ isBusy }
					/>
					<CheckboxControl
						label={ __( 'Auto sync with site pages' ) }
						checked={ autoSyncWithPages }
						onChange={ setAutoSyncWithPages }
						disabled={ isBusy }
						help={ __(
							'This menu will update automatically when you add, rename, or remove pages, until you choose to customize it manually.'
						) }
					/>
					<HStack justify="right" spacing={ 2 }>
						<Button
							variant="tertiary"
							onClick={ closeModal }
							disabled={ isBusy }
							accessibleWhenDisabled
							__next40pxDefaultSize
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							type="submit"
							aria-busy={ isBusy }
							disabled={ isBusy || ! menuTitle?.trim() }
							accessibleWhenDisabled
							__next40pxDefaultSize
						>
							{ __( 'Create Menu' ) }
						</Button>
					</HStack>
				</VStack>
			</form>
		</Modal>
	);
};
