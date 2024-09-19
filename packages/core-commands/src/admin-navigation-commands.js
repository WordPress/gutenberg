/**
 * WordPress dependencies
 */
import { useCommand, useCommandLoader } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import { getPath } from '@wordpress/url';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';

function useAddNewPageCommand() {
	const isSiteEditor = getPath( window.location.href )?.includes(
		'site-editor.php'
	);
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
	/**
	 * Creates a Post entity.
	 *
	 * @param {Object} options parameters for the post being created. These mirror those used on 3rd param of saveEntityRecord.
	 * @return {Object} the post type object that was created.
	 */
	const createPageEntity = useCallback(
		( options ) => {
			if ( ! userCanCreatePages ) {
				return Promise.reject( {
					message: __(
						'You do not have permission to create Pages.'
					),
				} );
			}
			return saveEntityRecord( 'postType', 'page', options );
		},
		[ saveEntityRecord, userCanCreatePages ]
	);

	const commands = useMemo( () => {
		if ( ! userCanCreatePages ) {
			return [];
		}
		return [
			{
				name: 'core/add-new-page',
				label: __( 'Add new page' ),
				icon: plus,
				callback: async () => {
					if ( isSiteEditor ) {
						const page = await createPageEntity( {
							status: 'draft',
						} );
						document.location.href = `/wp-admin/site-editor.php?postId=${ page.id }&postType=page&canvas=edit`;
						return;
					}
					document.location.href = 'post-new.php?post_type=page';
				},
			},
		];
	}, [ createPageEntity, isSiteEditor, userCanCreatePages ] );

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
