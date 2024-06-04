/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	AutosaveMonitor,
	LocalAutosaveMonitor,
	UnsavedChangesWarning,
	EditorKeyboardShortcutsRegister,
	EditorSnackbars,
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PluginArea } from '@wordpress/plugins';
import { __, sprintf } from '@wordpress/i18n';
import { useCallback, useMemo } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { privateApis as commandsPrivateApis } from '@wordpress/commands';
import { privateApis as coreCommandsPrivateApis } from '@wordpress/core-commands';
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import BackButton from '../back-button';
import EditPostKeyboardShortcuts from '../keyboard-shortcuts';
import InitPatternModal from '../init-pattern-modal';
import BrowserURL from '../browser-url';
import MetaBoxes from '../meta-boxes';
import PostEditorMoreMenu from '../more-menu';
import WelcomeGuide from '../welcome-guide';
import { store as editPostStore } from '../../store';
import { unlock } from '../../lock-unlock';
import useEditPostCommands from '../../commands/use-commands';
import { usePaddingAppender } from './use-padding-appender';
import { useShouldIframe } from './use-should-iframe';

const { getLayoutStyles } = unlock( blockEditorPrivateApis );
const { useCommands } = unlock( coreCommandsPrivateApis );
const { useCommandContext } = unlock( commandsPrivateApis );
const { EditorInterface, FullscreenMode, Sidebar } =
	unlock( editorPrivateApis );
const { BlockKeyboardShortcuts } = unlock( blockLibraryPrivateApis );
const DESIGN_POST_TYPES = [
	'wp_template',
	'wp_template_part',
	'wp_block',
	'wp_navigation',
];

function useEditorStyles() {
	const {
		hasThemeStyleSupport,
		editorSettings,
		isZoomedOutView,
		hasMetaBoxes,
		renderingMode,
		postType,
	} = useSelect( ( select ) => {
		const { __unstableGetEditorMode } = select( blockEditorStore );
		const { getCurrentPostType, getRenderingMode } = select( editorStore );
		const _postType = getCurrentPostType();
		return {
			hasThemeStyleSupport:
				select( editPostStore ).isFeatureActive( 'themeStyles' ),
			editorSettings: select( editorStore ).getEditorSettings(),
			isZoomedOutView: __unstableGetEditorMode() === 'zoom-out',
			hasMetaBoxes: select( editPostStore ).hasMetaBoxes(),
			renderingMode: getRenderingMode(),
			postType: _postType,
		};
	}, [] );

	// Compute the default styles.
	return useMemo( () => {
		const presetStyles =
			editorSettings.styles?.filter(
				( style ) =>
					style.__unstableType && style.__unstableType !== 'theme'
			) ?? [];

		const defaultEditorStyles = [
			...editorSettings.defaultEditorStyles,
			...presetStyles,
		];

		// Has theme styles if the theme supports them and if some styles were not preset styles (in which case they're theme styles).
		const hasThemeStyles =
			hasThemeStyleSupport &&
			presetStyles.length !== ( editorSettings.styles?.length ?? 0 );

		// If theme styles are not present or displayed, ensure that
		// base layout styles are still present in the editor.
		if ( ! editorSettings.disableLayoutStyles && ! hasThemeStyles ) {
			defaultEditorStyles.push( {
				css: getLayoutStyles( {
					style: {},
					selector: 'body',
					hasBlockGapSupport: false,
					hasFallbackGapSupport: true,
					fallbackGapValue: '0.5em',
				} ),
			} );
		}

		const baseStyles = hasThemeStyles
			? editorSettings.styles ?? []
			: defaultEditorStyles;

		// Add a constant padding for the typewritter effect. When typing at the
		// bottom, there needs to be room to scroll up.
		if (
			! isZoomedOutView &&
			! hasMetaBoxes &&
			renderingMode === 'post-only' &&
			! DESIGN_POST_TYPES.includes( postType )
		) {
			baseStyles.push( {
				css: 'body{padding-bottom: 40vh}',
			} );
		}

		return baseStyles;
	}, [
		editorSettings.defaultEditorStyles,
		editorSettings.disableLayoutStyles,
		editorSettings.styles,
		hasThemeStyleSupport,
	] );
}

function Layout( { initialPost } ) {
	useCommands();
	useEditPostCommands();
	const paddingAppenderRef = usePaddingAppender();
	const shouldIframe = useShouldIframe();
	const { createErrorNotice } = useDispatch( noticesStore );
	const {
		mode,
		isFullscreenActive,
		hasActiveMetaboxes,
		hasBlockSelected,
		showIconLabels,
		isDistractionFree,
		showMetaBoxes,
		hasHistory,
		isEditingTemplate,
		isWelcomeGuideVisible,
	} = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		const { getEditorSettings } = select( editorStore );
		const { isFeatureActive } = select( editPostStore );

		return {
			mode: select( editorStore ).getEditorMode(),
			isFullscreenActive:
				select( editPostStore ).isFeatureActive( 'fullscreenMode' ),
			hasActiveMetaboxes: select( editPostStore ).hasMetaBoxes(),
			hasBlockSelected:
				!! select( blockEditorStore ).getBlockSelectionStart(),
			showIconLabels: get( 'core', 'showIconLabels' ),
			isDistractionFree: get( 'core', 'distractionFree' ),
			showMetaBoxes:
				select( editorStore ).getRenderingMode() === 'post-only',
			hasHistory: !! getEditorSettings().onNavigateToPreviousEntityRecord,
			isEditingTemplate:
				select( editorStore ).getCurrentPostType() === 'wp_template',
			isWelcomeGuideVisible: isFeatureActive( 'welcomeGuide' ),
		};
	}, [] );

	// Set the right context for the command palette
	const commandContext = hasBlockSelected
		? 'block-selection-edit'
		: 'entity-edit';
	useCommandContext( commandContext );

	const styles = useEditorStyles();

	// We need to add the show-icon-labels class to the body element so it is applied to modals.
	if ( showIconLabels ) {
		document.body.classList.add( 'show-icon-labels' );
	} else {
		document.body.classList.remove( 'show-icon-labels' );
	}

	const className = clsx( 'edit-post-layout', 'is-mode-' + mode, {
		'has-metaboxes': hasActiveMetaboxes,
	} );

	function onPluginAreaError( name ) {
		createErrorNotice(
			sprintf(
				/* translators: %s: plugin name */
				__(
					'The "%s" plugin has encountered an error and cannot be rendered.'
				),
				name
			)
		);
	}

	const { createSuccessNotice } = useDispatch( noticesStore );

	const onActionPerformed = useCallback(
		( actionId, items ) => {
			switch ( actionId ) {
				case 'move-to-trash':
					{
						document.location.href = addQueryArgs( 'edit.php', {
							trashed: 1,
							post_type: items[ 0 ].type,
							ids: items[ 0 ].id,
						} );
					}
					break;
				case 'duplicate-post':
					{
						const newItem = items[ 0 ];
						const title =
							typeof newItem.title === 'string'
								? newItem.title
								: newItem.title?.rendered;
						createSuccessNotice(
							sprintf(
								// translators: %s: Title of the created post e.g: "Post 1".
								__( '"%s" successfully created.' ),
								title
							),
							{
								type: 'snackbar',
								id: 'duplicate-post-action',
								actions: [
									{
										label: __( 'Edit' ),
										onClick: () => {
											const postId = newItem.id;
											document.location.href =
												addQueryArgs( 'post.php', {
													post: postId,
													action: 'edit',
												} );
										},
									},
								],
							}
						);
					}
					break;
			}
		},
		[ createSuccessNotice ]
	);

	return (
		<>
			<FullscreenMode isActive={ isFullscreenActive } />
			<BrowserURL hasHistory={ hasHistory } />
			<UnsavedChangesWarning />
			<AutosaveMonitor />
			<LocalAutosaveMonitor />
			<EditPostKeyboardShortcuts />
			<EditorKeyboardShortcutsRegister />
			<BlockKeyboardShortcuts />
			<WelcomeGuide />
			<InitPatternModal />
			<PluginArea onError={ onPluginAreaError } />
			{ ! isDistractionFree && (
				<Sidebar
					onActionPerformed={ onActionPerformed }
					extraPanels={
						! isEditingTemplate && <MetaBoxes location="side" />
					}
				/>
			) }
			<PostEditorMoreMenu />
			<BackButton initialPost={ initialPost } />
			<EditorSnackbars />
			<EditorInterface
				className={ className }
				styles={ styles }
				forceIsDirty={ hasActiveMetaboxes }
				contentRef={ paddingAppenderRef }
				disableIframe={ ! shouldIframe }
				// We should auto-focus the canvas (title) on load.
				// eslint-disable-next-line jsx-a11y/no-autofocus
				autoFocus={ ! isWelcomeGuideVisible }
			>
				{ ! isDistractionFree && showMetaBoxes && (
					<div className="edit-post-layout__metaboxes">
						<MetaBoxes location="normal" />
						<MetaBoxes location="advanced" />
					</div>
				) }
			</EditorInterface>
		</>
	);
}

export default Layout;
