/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { __experimentalUseNavigator as useNavigator } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
/**
 * Internal dependencies
 */
import { postType } from '.';

function useDeleteNavigationMenu() {
	const { goTo } = useNavigator();

	const { deleteEntityRecord } = useDispatch( coreStore );

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const handleDelete = async ( navigationMenu ) => {
		const postId = navigationMenu?.id;
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

	return handleDelete;
}

function useSaveNavigationMenu() {
	const { getEditedEntityRecord } = useSelect( ( select ) => {
		const { getEditedEntityRecord: getEditedEntityRecordSelector } =
			select( coreStore );

		return {
			getEditedEntityRecord: getEditedEntityRecordSelector,
		};
	}, [] );

	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const handleSave = async ( navigationMenu, edits = {} ) => {
		const postId = navigationMenu?.id;
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

	return handleSave;
}

function useDuplicateNavigationMenu() {
	const { goTo } = useNavigator();

	const { saveEntityRecord } = useDispatch( coreStore );

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const handleDuplicate = async ( navigationMenu ) => {
		const menuTitle =
			navigationMenu?.title?.rendered || navigationMenu?.slug;

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

	return handleDuplicate;
}

export default function useNavigationMenuHandlers() {
	return {
		handleDelete: useDeleteNavigationMenu(),
		handleSave: useSaveNavigationMenu(),
		handleDuplicate: useDuplicateNavigationMenu(),
	};
}
