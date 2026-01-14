/**
 * WordPress 6.9 Command Palette integration.
 *
 * Registers commands for the admin-wide Command Palette (Ctrl/Cmd + K).
 * These commands allow quick access to Content Guidelines functionality
 * from anywhere in the WordPress admin.
 *
 * @package ContentGuidelines
 * @since 0.2.0
 */

/**
 * WordPress dependencies
 */
import { useCommand, useCommandLoader } from '@wordpress/commands';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { useDispatch } from '@wordpress/data';
import {
	edit,
	backup,
	check,
	settings,
	page,
	pencil,
	seen,
	external,
} from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { STORE_NAME } from '../store';

/**
 * Hook to register static Content Guidelines commands.
 *
 * These commands are always available in the Command Palette
 * when Content Guidelines is active.
 */
export function useContentGuidelinesCommands() {
	// Navigation commands
	useCommand( {
		name: 'content-guidelines/open-guidelines',
		label: __( 'Open Content Guidelines', 'content-guidelines' ),
		icon: edit,
		callback: ( { close } ) => {
			window.location.href = 'themes.php?page=guidelines';
			close();
		},
		context: 'site-editor',
	} );

	useCommand( {
		name: 'content-guidelines/open-guidelines-history',
		label: __( 'View Guidelines History', 'content-guidelines' ),
		icon: backup,
		callback: ( { close } ) => {
			window.location.href =
				'themes.php?page=guidelines#/history';
			close();
		},
	} );

	useCommand( {
		name: 'content-guidelines/open-playground',
		label: __( 'Open Guidelines Playground', 'content-guidelines' ),
		icon: seen,
		callback: ( { close } ) => {
			window.location.href =
				'themes.php?page=guidelines#/playground';
			close();
		},
	} );
}

/**
 * Hook to register dynamic commands based on guidelines state.
 *
 * Uses useCommandLoader to provide commands that depend on current state,
 * such as publish/discard draft commands that only appear when a draft exists.
 */
export function useContentGuidelinesDynamicCommands() {
	const { hasDraftValue, isLoading } = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			hasDraftValue: store?.hasDraft?.() ?? false,
			isLoading: store?.isResolving?.( 'getGuidelines' ) ?? false,
		};
	}, [] );

	// Register draft-related commands dynamically
	useCommandLoader( {
		name: 'content-guidelines/draft-commands',
		hook: useContentGuidelinesDraftCommands,
		context: 'site-editor',
	} );
}

/**
 * Command loader hook for draft-related commands.
 *
 * @return {Object} Commands configuration for the loader.
 */
function useContentGuidelinesDraftCommands() {
	const { hasDraftValue } = useSelect( ( select ) => {
		const store = select( STORE_NAME );
		return {
			hasDraftValue: store?.hasDraft?.() ?? false,
		};
	}, [] );

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const commands = [];

	if ( hasDraftValue ) {
		commands.push( {
			name: 'content-guidelines/publish-draft',
			label: __( 'Publish Guidelines Draft', 'content-guidelines' ),
			icon: check,
			callback: async ( { close } ) => {
				try {
					const response = await wp.apiFetch( {
						path: '/wp/v2/content-guidelines/publish',
						method: 'POST',
					} );

					if ( response.success ) {
						createSuccessNotice(
							__( 'Guidelines published.', 'content-guidelines' ),
							{ type: 'snackbar' }
						);
					}
				} catch ( error ) {
					createErrorNotice(
						__(
							'Failed to publish guidelines.',
							'content-guidelines'
						),
						{ type: 'snackbar' }
					);
				}
				close();
			},
		} );

		commands.push( {
			name: 'content-guidelines/discard-draft',
			label: __( 'Discard Guidelines Draft', 'content-guidelines' ),
			icon: page,
			callback: async ( { close } ) => {
				try {
					const response = await wp.apiFetch( {
						path: '/wp/v2/content-guidelines/discard-draft',
						method: 'POST',
					} );

					if ( response.success ) {
						createSuccessNotice(
							__( 'Draft discarded.', 'content-guidelines' ),
							{ type: 'snackbar' }
						);
					}
				} catch ( error ) {
					createErrorNotice(
						__( 'Failed to discard draft.', 'content-guidelines' ),
						{ type: 'snackbar' }
					);
				}
				close();
			},
		} );
	}

	return {
		commands,
		isLoading: false,
	};
}

/**
 * Hook to register post-context commands.
 *
 * These commands appear when editing a post and allow
 * running guidelines checks on the current content.
 */
export function useContentGuidelinesPostCommands() {
	useCommandLoader( {
		name: 'content-guidelines/post-commands',
		hook: usePostContextCommands,
		context: 'post-editor',
	} );
}

/**
 * Command loader hook for post editing context.
 *
 * @return {Object} Commands configuration.
 */
function usePostContextCommands() {
	const { currentPostId, currentPostType } = useSelect( ( select ) => {
		const editor = select( 'core/editor' );
		return {
			currentPostId: editor?.getCurrentPostId?.() ?? null,
			currentPostType: editor?.getCurrentPostType?.() ?? null,
		};
	}, [] );

	const { createSuccessNotice, createErrorNotice } =
		useDispatch( noticesStore );

	const commands = [];

	if ( currentPostId && currentPostType === 'post' ) {
		commands.push( {
			name: 'content-guidelines/check-post-guidelines',
			label: __( 'Check Post Against Guidelines', 'content-guidelines' ),
			icon: pencil,
			callback: async ( { close } ) => {
				try {
					const response = await wp.apiFetch( {
						path: '/wp/v2/content-guidelines/test',
						method: 'POST',
						data: {
							task: 'rewrite_intro',
							fixture_post_id: currentPostId,
							use: 'active',
						},
					} );

					const issueCount = response.lint_results?.issue_count ?? 0;

					if ( issueCount === 0 ) {
						createSuccessNotice(
							__(
								'Content passes all guidelines checks!',
								'content-guidelines'
							),
							{ type: 'snackbar' }
						);
					} else {
						createErrorNotice(
							`${ issueCount } ${ __(
								'guideline issues found. Open Content Guidelines to review.',
								'content-guidelines'
							) }`,
							{
								type: 'snackbar',
								actions: [
									{
										label: __( 'View', 'content-guidelines' ),
										url: 'themes.php?page=guidelines#/playground',
									},
								],
							}
						);
					}
				} catch ( error ) {
					createErrorNotice(
						__(
							'Failed to check guidelines.',
							'content-guidelines'
						),
						{ type: 'snackbar' }
					);
				}
				close();
			},
		} );

		commands.push( {
			name: 'content-guidelines/test-post-in-playground',
			label: __(
				'Test Current Post in Guidelines Playground',
				'content-guidelines'
			),
			icon: external,
			callback: ( { close } ) => {
				window.location.href = `themes.php?page=guidelines#/playground?post=${ currentPostId }`;
				close();
			},
		} );
	}

	return {
		commands,
		isLoading: false,
	};
}

/**
 * Register all Content Guidelines commands.
 *
 * This component should be rendered once to register all commands.
 * It uses React hooks internally to register with the Command Palette.
 */
export default function ContentGuidelinesCommands() {
	useContentGuidelinesCommands();
	useContentGuidelinesDynamicCommands();
	useContentGuidelinesPostCommands();

	// This component doesn't render anything
	return null;
}
