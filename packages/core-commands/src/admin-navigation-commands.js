/**
 * WordPress dependencies
 */
import { useCommand, useCommandLoader } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { getPath } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import { unlock } from './lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

function useAddNewPageCommand() {
	const isSiteEditor = getPath( window.location.href )?.includes(
		'site-editor.php'
	);
	const history = useHistory();
	const { userCanCreatePages } = useSelect( ( select ) => {
		const { canUser } = select( coreStore );
		return {
			userCanCreatePages: canUser( 'create', {
				kind: 'postType',
				name: 'page',
			} ),
		};
	}, [] );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const createPageEntity = async () => {
		try {
			const page = await saveEntityRecord(
				'postType',
				'page',
				{
					status: 'draft',
				},
				{
					throwOnError: true,
				}
			);
			if ( page?.id ) {
				history.push( {
					postId: page.id,
					postType: 'page',
					canvas: 'edit',
				} );
			}
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the item.' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
			} );
		}
	};

	const redirectToPostEditor = () =>
		( document.location.href = 'post-new.php?post_type=page' );

	const addNewPage = ! isSiteEditor ? redirectToPostEditor : createPageEntity;

	const commands = useMemo( () => {
		if ( ! userCanCreatePages ) {
			return [];
		}
		return [
			{
				name: 'core/add-new-page',
				label: __( 'Add new page' ),
				icon: plus,
				callback: addNewPage,
			},
		];
	}, [ addNewPage, userCanCreatePages ] );

	return {
		isLoading: false,
		commands,
	};
}

export function useAdminNavigationCommands() {
	useCommand( {
		name: 'core/add-new-post',
		label: __( 'Add new post' ),
		icon: plus,
		callback: () => {
			document.location.href = 'post-new.php';
		},
	} );

	useCommandLoader( {
		name: 'core/add-new-page',
		hook: useAddNewPageCommand,
	} );
}
