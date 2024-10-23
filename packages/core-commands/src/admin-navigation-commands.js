/**
 * WordPress dependencies
 */
import { useCommand, useCommandLoader } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { getPath } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect, useDispatch } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
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
	const isBlockBasedTheme = useSelect( ( select ) => {
		return select( coreStore ).getCurrentTheme()?.is_block_theme;
	}, [] );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice } = useDispatch( noticesStore );

	const createPageEntity = useCallback(
		async ( { close } ) => {
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
			} finally {
				close();
			}
		},
		[ createErrorNotice, history, saveEntityRecord ]
	);

	const commands = useMemo( () => {
		const addNewPage =
			isSiteEditor && isBlockBasedTheme
				? createPageEntity
				: () =>
						( document.location.href =
							'post-new.php?post_type=page' );
		return [
			{
				name: 'core/add-new-page',
				label: __( 'Add new page' ),
				icon: plus,
				callback: addNewPage,
			},
		];
	}, [ createPageEntity, isSiteEditor, isBlockBasedTheme ] );

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
