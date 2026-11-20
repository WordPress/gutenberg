import { useNavigate } from '@wordpress/route';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';
import {
	Button,
	Modal,
	TextControl,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { CheckboxControl } from '@wordpress/ui';

const NAVIGATION_POST_TYPE = 'wp_navigation';

export const AddNavigationModal = ( {
	closeModal,
}: {
	closeModal?: () => void;
} ) => {
	const [ menuTitle, setMenuTitle ] = useState( '' );
	const [ isBusy, setIsBusy ] = useState( false );
	// With the experiment on, a new menu lists every page (an Auto menu)
	// unless this is unticked.
	const isMenuEditing = !! ( window as any )
		.__experimentalNavigationMenuEditing;
	const [ includePages, setIncludePages ] = useState( true );
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
					...( isMenuEditing && includePages
						? { content: '<!-- wp:page-list /-->' }
						: {} ),
				},
				{
					throwOnError: true,
				}
			);

			if ( savedRecord ) {
				createSuccessNotice(
					( window as any ).__experimentalNavigationMenuEditing
						? __( 'Menu created.' )
						: __( 'Navigation menu created successfully.' ),
					{
						type: 'snackbar',
					}
				);

				// Navigate to the newly created navigation menu
				navigate( {
					to: `/navigation/edit/${ encodeURIComponent(
						// Saved navigation menus have a numeric ID.
						savedRecord.id as number
					) }`,
				} );
			}
		} catch ( error ) {
			const errorMessage =
				error instanceof Error ? error.message : 'Unknown error';
			createErrorNotice(
				( window as any ).__experimentalNavigationMenuEditing
					? sprintf(
							/* translators: %s: error message describing why the menu could not be created. */
							__( 'Unable to create menu: %s' ),
							errorMessage
						)
					: sprintf(
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
			title={
				( window as any ).__experimentalNavigationMenuEditing
					? __( 'Add New Menu' )
					: __( 'Add New Navigation Menu' )
			}
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
					{ isMenuEditing && (
						<CheckboxControl
							label={ __(
								'Automatically include all new pages'
							) }
							description={ __(
								'The menu lists your pages, and new pages are added as you publish them. You can customize it later.'
							) }
							checked={ includePages }
							onCheckedChange={ setIncludePages }
							disabled={ isBusy }
						/>
					) }
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
