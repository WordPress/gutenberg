/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { __, sprintf } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { postType } from '.';
import { NAVIGATION_POST_TYPE } from '../../utils/constants';
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

function useDeleteNavigationMenu() {
	const { deleteEntityRecord } = useDispatch( coreStore );
	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );
	const history = useHistory();

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
			createSuccessNotice(
				__( 'Navigation Menu successfully deleted.' ),
				{
					type: 'snackbar',
				}
			);
			history.push( { path: '/navigation' } );
		} catch ( error ) {
			createErrorNotice(
				sprintf(
					/* translators: %s: error message describing why the navigation menu could not be deleted. */
					__( `Unable to delete Navigation Menu (%s).` ),
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

	const {
		editEntityRecord,
		__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
	} = useDispatch( coreStore );

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const handleSave = async ( navigationMenu, edits ) => {
		if ( ! edits ) {
			return;
		}

		const postId = navigationMenu?.id;
		// Prepare for revert in case of error.
		const originalRecord = getEditedEntityRecord(
			'postType',
			NAVIGATION_POST_TYPE,
			postId
		);

		// Apply the edits.
		editEntityRecord( 'postType', postType, postId, edits );

		const recordPropertiesToSave = Object.keys( edits );

		// Attempt to persist.
		try {
			await saveSpecifiedEntityEdits(
				'postType',
				postType,
				postId,
				recordPropertiesToSave,
				{
					throwOnError: true,
				}
			);
			createSuccessNotice( __( 'Renamed Navigation Menu' ), {
				type: 'snackbar',
			} );
		} catch ( error ) {
			// Revert to original in case of error.
			editEntityRecord( 'postType', postType, postId, originalRecord );

			createErrorNotice(
				sprintf(
					/* translators: %s: error message describing why the navigation menu could not be renamed. */
					__( `Unable to rename Navigation Menu (%s).` ),
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
	const history = useHistory();
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
				createSuccessNotice( __( 'Duplicated Navigation Menu' ), {
					type: 'snackbar',
				} );
				history.push( { postType, postId: savedRecord.id } );
			}
		} catch ( error ) {
			createErrorNotice(
				sprintf(
					/* translators: %s: error message describing why the navigation menu could not be deleted. */
					__( `Unable to duplicate Navigation Menu (%s).` ),
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
