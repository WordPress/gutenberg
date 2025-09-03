/**
 * WordPress dependencies
 */
import { useCommandLoader } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { plus, dashboard } from '@wordpress/icons';
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

const getAddNewPageCommand = () =>
	function useAddNewPageCommand() {
		const canCreatePage = useSelect(
			( select ) =>
				select( coreStore ).canUser( 'create', {
					kind: 'postType',
					name: 'page',
				} ),
			[]
		);
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
						history.navigate( `/page/${ page.id }?canvas=edit` );
					}
				} catch ( error ) {
					const errorMessage =
						error.message && error.code !== 'unknown_error'
							? error.message
							: __(
									'An error occurred while creating the item.'
							  );

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
			if ( ! canCreatePage ) {
				return [];
			}

			const addNewPage =
				isSiteEditor && isBlockBasedTheme
					? createPageEntity
					: () =>
							( document.location.href =
								'post-new.php?post_type=page' );
			return [
				{
					name: 'core/add-new-page',
					label: __( 'Add Page' ),
					icon: plus,
					callback: addNewPage,
					keywords: [
						__( 'page' ),
						__( 'new' ),
						__( 'add' ),
						__( 'create' ),
					],
				},
			];
		}, [
			createPageEntity,
			isSiteEditor,
			isBlockBasedTheme,
			canCreatePage,
		] );

		return {
			isLoading: false,
			commands,
		};
	};

const getAdminBasicNavigationCommands = () =>
	function useAdminBasicNavigationCommands() {
		const { isBlockBasedTheme, canCreateTemplate } = useSelect(
			( select ) => {
				return {
					isBlockBasedTheme:
						select( coreStore ).getCurrentTheme()?.is_block_theme,
					canCreateTemplate: select( coreStore ).canUser( 'create', {
						kind: 'postType',
						name: 'wp_template',
					} ),
				};
			},
			[]
		);

		const commands = useMemo( () => {
			if ( canCreateTemplate && isBlockBasedTheme ) {
				const isSiteEditor = getPath( window.location.href )?.includes(
					'site-editor.php'
				);
				if ( ! isSiteEditor ) {
					return [
						{
							name: 'core/go-to-site-editor',
							label: __( 'Open Site Editor' ),
							callback: ( { close } ) => {
								close();
								document.location = 'site-editor.php';
							},
						},
					];
				}
			}

			return [];
		}, [ canCreateTemplate, isBlockBasedTheme ] );

		return {
			commands,
			isLoading: false,
		};
	};

const getDashboardCommand = () =>
	function useDashboardCommand() {
		const currentPath = getPath( window.location.href );

		const isEditorScreen =
			currentPath?.includes( 'site-editor.php' ) ||
			currentPath?.includes( 'post.php' ) ||
			currentPath?.includes( 'post-new.php' ) ||
			currentPath?.includes( 'widgets.php' ) ||
			currentPath?.includes( 'customize.php' );

		const commands = useMemo( () => {
			if ( isEditorScreen ) {
				return [
					{
						name: 'core/dashboard',
						label: __( 'Dashboard' ),
						icon: dashboard,
						callback: () => {
							document.location.assign( 'index.php' );
						},
					},
				];
			}
			return [];
		}, [ isEditorScreen ] );

		return {
			isLoading: false,
			commands,
		};
	};

const getAddNewPostCommand = () =>
	function useAddNewPostCommand() {
		const canCreatePost = useSelect(
			( select ) =>
				select( coreStore ).canUser( 'create', {
					kind: 'postType',
					name: 'post',
				} ),
			[]
		);

		const commands = useMemo( () => {
			if ( ! canCreatePost ) {
				return [];
			}

			return [
				{
					name: 'core/add-new-post',
					label: __( 'Add Post' ),
					icon: plus,
					callback: () => {
						document.location.assign( 'post-new.php' );
					},
					keywords: [
						__( 'post' ),
						__( 'new' ),
						__( 'add' ),
						__( 'create' ),
					],
				},
			];
		}, [ canCreatePost ] );

		return {
			isLoading: false,
			commands,
		};
	};

export function useAdminNavigationCommands() {
	useCommandLoader( {
		name: 'core/add-new-post',
		hook: getAddNewPostCommand(),
	} );

	useCommandLoader( {
		name: 'core/dashboard',
		hook: getDashboardCommand(),
	} );

	useCommandLoader( {
		name: 'core/add-new-page',
		hook: getAddNewPageCommand(),
	} );

	useCommandLoader( {
		name: 'core/admin-navigation',
		hook: getAdminBasicNavigationCommands(),
	} );
}
