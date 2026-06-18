/**
 * WordPress dependencies
 */
import { useNavigate, useParams } from '@wordpress/route';
import { Page, Breadcrumbs } from '@wordpress/admin-ui';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { __, sprintf } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import type { Post } from '@wordpress/core-data';
import {
	Button,
	DropdownMenu,
	MenuGroup,
	MenuItem,
	Modal,
	TextControl,
} from '@wordpress/components';
import { useState } from '@wordpress/element';
import { moreVertical, pencil, postCategories, trash } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import NavigationMenuEditor from './editor';

const NAVIGATION_POST_TYPE = 'wp_navigation';

function getErrorMessage( error: unknown ) {
	return error instanceof Error ? error.message : __( 'Unknown error' );
}

function NavigationEditStage() {
	const { id } = useParams( { from: '/navigation/edit/$id' } );
	const navigate = useNavigate();
	const navigationId = parseInt( id );
	const [ isAddingItems, setIsAddingItems ] = useState( false );
	const [ isRenaming, setIsRenaming ] = useState( false );
	const [ isDeleting, setIsDeleting ] = useState( false );
	const [ renameTitle, setRenameTitle ] = useState( '' );
	const [ isBusy, setIsBusy ] = useState( false );
	const { navigationMenu } = useSelect(
		( select ) => {
			const { getEntityRecord } = select( coreStore );

			return {
				navigationMenu: getEntityRecord(
					'postType',
					NAVIGATION_POST_TYPE,
					navigationId
				) as Post,
			};
		},
		[ navigationId ]
	);
	const { saveEntityRecord, deleteEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	if ( ! navigationMenu ) {
		return;
	}

	const menuTitle =
		navigationMenu.title?.rendered || navigationMenu.title?.raw || '';
	const decodedMenuTitle = decodeEntities( menuTitle );

	const openRenameModal = () => {
		setRenameTitle( decodedMenuTitle );
		setIsRenaming( true );
	};

	const closeRenameModal = () => {
		if ( isBusy ) {
			return;
		}
		setIsRenaming( false );
	};

	const renameNavigationMenu = async () => {
		const trimmedTitle = renameTitle.trim();
		if ( ! trimmedTitle ) {
			return;
		}

		setIsBusy( true );
		try {
			await saveEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				{
					id: navigationId,
					title: trimmedTitle,
				},
				{
					throwOnError: true,
				}
			);
			createSuccessNotice( __( 'Navigation menu renamed.' ), {
				type: 'snackbar',
			} );
			setIsRenaming( false );
		} catch ( error ) {
			createErrorNotice(
				sprintf(
					/* translators: %s: error message describing why the navigation menu could not be renamed. */
					__( 'Unable to rename navigation menu (%s).' ),
					getErrorMessage( error )
				),
				{
					type: 'snackbar',
				}
			);
		} finally {
			setIsBusy( false );
		}
	};

	const closeDeleteModal = () => {
		if ( isBusy ) {
			return;
		}
		setIsDeleting( false );
	};

	const deleteNavigationMenu = async () => {
		setIsBusy( true );
		try {
			await deleteEntityRecord(
				'postType',
				NAVIGATION_POST_TYPE,
				navigationId,
				{
					force: true,
				},
				{
					throwOnError: true,
				}
			);
			createSuccessNotice( __( 'Navigation menu deleted.' ), {
				type: 'snackbar',
			} );
			navigate( {
				to: '/navigation/list',
			} );
		} catch ( error ) {
			createErrorNotice(
				sprintf(
					/* translators: %s: error message describing why the navigation menu could not be deleted. */
					__( 'Unable to delete navigation menu (%s).' ),
					getErrorMessage( error )
				),
				{
					type: 'snackbar',
				}
			);
		} finally {
			setIsBusy( false );
		}
	};

	return (
		<>
			<Page
				ariaLabel={ decodedMenuTitle }
				headingLevel={ 2 }
				breadcrumbs={
					<Breadcrumbs
						items={ [
							{
								label: __( 'Navigation' ),
								to: '/navigation/list',
							},
							{
								label: decodedMenuTitle,
							},
						] }
					/>
				}
				hasPadding
				actions={
					<DropdownMenu
						icon={ moreVertical }
						label={ __( 'Navigation menu options' ) }
						popoverProps={ { placement: 'bottom-end' } }
						toggleProps={ {
							variant: 'tertiary',
							__next40pxDefaultSize: true,
						} }
					>
						{ ( { onClose } ) => (
							<>
								<MenuGroup>
									<MenuItem
										icon={ postCategories }
										onClick={ () => {
											setIsAddingItems( true );
											onClose();
										} }
									>
										{ __( 'Add menu items' ) }
									</MenuItem>
									<MenuItem
										icon={ pencil }
										onClick={ () => {
											openRenameModal();
											onClose();
										} }
									>
										{ __( 'Rename' ) }
									</MenuItem>
								</MenuGroup>
								<MenuGroup>
									<MenuItem
										icon={ trash }
										isDestructive
										onClick={ () => {
											setIsDeleting( true );
											onClose();
										} }
									>
										{ __( 'Delete' ) }
									</MenuItem>
								</MenuGroup>
							</>
						) }
					</DropdownMenu>
				}
			>
				<NavigationMenuEditor
					id={ navigationId }
					isAddingItems={ isAddingItems }
					navigationMenu={ navigationMenu }
					onAddMenuItems={ () => setIsAddingItems( true ) }
					onCloseAddMenuItems={ () => setIsAddingItems( false ) }
				/>
			</Page>
			{ isRenaming && (
				<Modal
					title={ __( 'Rename navigation menu' ) }
					onRequestClose={ closeRenameModal }
				>
					<TextControl
						label={ __( 'Name' ) }
						value={ renameTitle }
						onChange={ setRenameTitle }
						disabled={ isBusy }
						__next40pxDefaultSize
					/>
					<Stack direction="row" justify="flex-end" gap="sm">
						<Button
							variant="tertiary"
							onClick={ closeRenameModal }
							disabled={ isBusy }
							accessibleWhenDisabled
							__next40pxDefaultSize
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							onClick={ renameNavigationMenu }
							disabled={ isBusy || ! renameTitle.trim() }
							accessibleWhenDisabled
							isBusy={ isBusy }
							__next40pxDefaultSize
						>
							{ __( 'Save' ) }
						</Button>
					</Stack>
				</Modal>
			) }
			{ isDeleting && (
				<Modal
					title={ __( 'Delete navigation menu' ) }
					onRequestClose={ closeDeleteModal }
				>
					<p>
						{ sprintf(
							/* translators: %s: navigation menu title. */
							__(
								'Are you sure you want to delete "%s"? This cannot be undone.'
							),
							decodedMenuTitle
						) }
					</p>
					<Stack direction="row" justify="flex-end" gap="sm">
						<Button
							variant="tertiary"
							onClick={ closeDeleteModal }
							disabled={ isBusy }
							accessibleWhenDisabled
							__next40pxDefaultSize
						>
							{ __( 'Cancel' ) }
						</Button>
						<Button
							variant="primary"
							isDestructive
							onClick={ deleteNavigationMenu }
							disabled={ isBusy }
							accessibleWhenDisabled
							isBusy={ isBusy }
							__next40pxDefaultSize
						>
							{ __( 'Delete' ) }
						</Button>
					</Stack>
				</Modal>
			) }
		</>
	);
}

export const stage = NavigationEditStage;
