/**
 * WordPress dependencies
 */
import { useEntityRecord, store as coreStore } from '@wordpress/core-data';
import {
	__experimentalUseNavigator as useNavigator,
	Spinner,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';

import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { SidebarNavigationScreenWrapper } from '../sidebar-navigation-screen-navigation-menus';
import ScreenNavigationMoreMenu from './more-menu';
import NavigationMenuEditor from './navigation-menu-editor';

export const noop = () => {};

export default function SidebarNavigationScreenNavigationMenu() {
	const {
		deleteEntityRecord,
		saveEntityRecord,
		editEntityRecord,
		saveEditedEntityRecord,
	} = useDispatch( coreStore );

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const postType = `wp_navigation`;
	const {
		goTo,
		params: { postId },
	} = useNavigator();

	const { record: navigationMenu, isResolving } = useEntityRecord(
		'postType',
		postType,
		postId
	);

	const { getEditedEntityRecord, isSaving, isDeleting } = useSelect(
		( select ) => {
			const {
				isSavingEntityRecord,
				isDeletingEntityRecord,
				getEditedEntityRecord: getEditedEntityRecordSelector,
			} = select( coreStore );

			return {
				isSaving: isSavingEntityRecord( 'postType', postType, postId ),
				isDeleting: isDeletingEntityRecord(
					'postType',
					postType,
					postId
				),
				getEditedEntityRecord: getEditedEntityRecordSelector,
			};
		},
		[ postId, postType ]
	);

	const isLoading = isResolving || isSaving || isDeleting;

	const menuTitle = navigationMenu?.title?.rendered || navigationMenu?.slug;

	const handleSave = async ( edits = {} ) => {
		// Prepare for revert in case of error.
		const originalRecord = getEditedEntityRecord(
			'postType',
			'wp_navigation',
			postId
		);

		// Apply the edits.
		editEntityRecord( 'postType', postType, postId, edits );

		// Attempt to persist.
		try {
			await saveEditedEntityRecord( 'postType', postType, postId, {
				throwOnError: true,
			} );
			createSuccessNotice( __( 'Renamed Navigation menu' ), {
				type: 'snackbar',
			} );
		} catch ( error ) {
			// Revert to original in case of error.
			editEntityRecord( 'postType', postType, postId, originalRecord );

			createErrorNotice(
				sprintf(
					/* translators: %s: error message describing why the navigation menu could not be renamed. */
					__( `Unable to rename Navigation menu (%s).` ),
					error?.message
				),

				{
					type: 'snackbar',
				}
			);
		}
	};

	const handleDelete = async () => {
		try {
			await deleteEntityRecord(
				'postType',
				postType,
				postId,
				{
					force: true,
				},
				{
					throwOnError: true,
				}
			);
			createSuccessNotice( __( 'Deleted Navigation menu' ), {
				type: 'snackbar',
			} );
			goTo( '/navigation' );
		} catch ( error ) {
			createErrorNotice(
				sprintf(
					/* translators: %s: error message describing why the navigation menu could not be deleted. */
					__( `Unable to delete Navigation menu (%s).` ),
					error?.message
				),

				{
					type: 'snackbar',
				}
			);
		}
	};
	const handleDuplicate = async () => {
		try {
			const savedRecord = await saveEntityRecord(
				'postType',
				postType,
				{
					title: sprintf(
						/* translators: %s: Navigation menu title */
						__( '%s (Copy)' ),
						menuTitle
					),
					content: navigationMenu?.content?.raw,
					status: 'publish',
				},
				{
					throwOnError: true,
				}
			);

			if ( savedRecord ) {
				createSuccessNotice( __( 'Duplicated Navigation menu' ), {
					type: 'snackbar',
				} );
				goTo( `/navigation/${ postType }/${ savedRecord.id }` );
			}
		} catch ( error ) {
			createErrorNotice(
				sprintf(
					/* translators: %s: error message describing why the navigation menu could not be deleted. */
					__( `Unable to duplicate Navigation menu (%s).` ),
					error?.message
				),

				{
					type: 'snackbar',
				}
			);
		}
	};

	if ( isLoading ) {
		return (
			<SidebarNavigationScreenWrapper
				description={ __(
					'Navigation menus are a curated collection of blocks that allow visitors to get around your site.'
				) }
			>
				<Spinner className="edit-site-sidebar-navigation-screen-navigation-menus__loading" />
			</SidebarNavigationScreenWrapper>
		);
	}

	if ( ! isLoading && ! navigationMenu ) {
		return (
			<SidebarNavigationScreenWrapper
				description={ __( 'Navigation Menu missing.' ) }
			/>
		);
	}

	if ( ! navigationMenu?.content?.raw ) {
		return (
			<SidebarNavigationScreenWrapper
				actions={
					<ScreenNavigationMoreMenu
						menuTitle={ decodeEntities( menuTitle ) }
						onDelete={ handleDelete }
						onSave={ handleSave }
						onDuplicate={ handleDuplicate }
					/>
				}
				title={ decodeEntities( menuTitle ) }
				description={ __( 'This Navigation Menu is empty.' ) }
			/>
		);
	}

	return (
		<SidebarNavigationScreenWrapper
			actions={
				<ScreenNavigationMoreMenu
					menuTitle={ decodeEntities( menuTitle ) }
					onDelete={ handleDelete }
					onSave={ handleSave }
					onDuplicate={ handleDuplicate }
				/>
			}
			title={ decodeEntities( menuTitle ) }
			description={ __(
				'Navigation menus are a curated collection of blocks that allow visitors to get around your site.'
			) }
		>
			<NavigationMenuEditor navigationMenu={ navigationMenu } />
		</SidebarNavigationScreenWrapper>
	);
}
