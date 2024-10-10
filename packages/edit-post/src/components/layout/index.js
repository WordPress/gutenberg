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
	ErrorBoundary,
	PostLockedModal,
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
import {
	useCallback,
	useMemo,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	CommandMenu,
	privateApis as commandsPrivateApis,
} from '@wordpress/commands';
import { privateApis as coreCommandsPrivateApis } from '@wordpress/core-commands';
import { privateApis as blockLibraryPrivateApis } from '@wordpress/block-library';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';
import {
	Icon,
	ResizableBox,
	SlotFillProvider,
	Tooltip,
	VisuallyHidden,
	__unstableUseNavigateRegions as useNavigateRegions,
} from '@wordpress/components';
import {
	useMediaQuery,
	useRefEffect,
	useViewportMatch,
} from '@wordpress/compose';

/**
 * Internal dependencies
 */
import BackButton from '../back-button';
import EditorInitialization from '../editor-initialization';
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
import useNavigateToEntityRecord from '../../hooks/use-navigate-to-entity-record';

const { getLayoutStyles } = unlock( blockEditorPrivateApis );
const { useCommands } = unlock( coreCommandsPrivateApis );
const { useCommandContext } = unlock( commandsPrivateApis );
const { Editor, FullscreenMode, NavigableRegion } = unlock( editorPrivateApis );
const { BlockKeyboardShortcuts } = unlock( blockLibraryPrivateApis );
const DESIGN_POST_TYPES = [
	'wp_template',
	'wp_template_part',
	'wp_block',
	'wp_navigation',
];

function useEditorStyles( ...additionalStyles ) {
	const { hasThemeStyleSupport, editorSettings } = useSelect( ( select ) => {
		return {
			hasThemeStyleSupport:
				select( editPostStore ).isFeatureActive( 'themeStyles' ),
			editorSettings: select( editorStore ).getEditorSettings(),
		};
	}, [] );

	const addedStyles = additionalStyles.join( '\n' );

	// Compute the default styles.
	return useMemo( () => {
		const presetStyles =
			editorSettings.styles?.filter(
				( style ) =>
					style.__unstableType && style.__unstableType !== 'theme'
			) ?? [];

		const defaultEditorStyles = [
			...( editorSettings?.defaultEditorStyles ?? [] ),
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

		if ( addedStyles ) {
			return [ ...baseStyles, { css: addedStyles } ];
		}

		return baseStyles;
	}, [
		editorSettings.defaultEditorStyles,
		editorSettings.disableLayoutStyles,
		editorSettings.styles,
		hasThemeStyleSupport,
		addedStyles,
	] );
}

/**
 * @param {Object}  props
 * @param {boolean} props.isLegacy True when the editor canvas is not in an iframe.
 */
function MetaBoxesMain( { isLegacy } ) {
	const [ isOpen, openHeight, hasAnyVisible ] = useSelect( ( select ) => {
		const { get } = select( preferencesStore );
		const { isMetaBoxLocationVisible } = select( editPostStore );
		return [
			get( 'core/edit-post', 'metaBoxesMainIsOpen' ),
			get( 'core/edit-post', 'metaBoxesMainOpenHeight' ),
			isMetaBoxLocationVisible( 'normal' ) ||
				isMetaBoxLocationVisible( 'advanced' ) ||
				isMetaBoxLocationVisible( 'side' ),
		];
	}, [] );
	const { set: setPreference } = useDispatch( preferencesStore );
	const metaBoxesMainRef = useRef();
	const isShort = useMediaQuery( '(max-height: 549px)' );

	const [ { min, max }, setHeightConstraints ] = useState( () => ( {} ) );
	// Keeps the resizable area’s size constraints updated taking into account
	// editor notices. The constraints are also used to derive the value for the
	// aria-valuenow attribute on the seperator.
	const effectSizeConstraints = useRefEffect( ( node ) => {
		const container = node.closest(
			'.interface-interface-skeleton__content'
		);
		const noticeLists = container.querySelectorAll(
			':scope > .components-notice-list'
		);
		const resizeHandle = container.querySelector(
			'.edit-post-meta-boxes-main__presenter'
		);
		const deriveConstraints = () => {
			const fullHeight = container.offsetHeight;
			let nextMax = fullHeight;
			for ( const element of noticeLists ) {
				nextMax -= element.offsetHeight;
			}
			const nextMin = resizeHandle.offsetHeight;
			setHeightConstraints( { min: nextMin, max: nextMax } );
		};
		const observer = new window.ResizeObserver( deriveConstraints );
		observer.observe( container );
		for ( const element of noticeLists ) {
			observer.observe( element );
		}
		return () => observer.disconnect();
	}, [] );

	const separatorRef = useRef();
	const separatorHelpId = useId();

	const [ isUntouched, setIsUntouched ] = useState( true );
	const applyHeight = ( candidateHeight, isPersistent, isInstant ) => {
		const nextHeight = Math.min( max, Math.max( min, candidateHeight ) );
		if ( isPersistent ) {
			setPreference(
				'core/edit-post',
				'metaBoxesMainOpenHeight',
				nextHeight
			);
		} else {
			separatorRef.current.ariaValueNow = getAriaValueNow( nextHeight );
		}
		if ( isInstant ) {
			metaBoxesMainRef.current.updateSize( {
				height: nextHeight,
				// Oddly, when the event that triggered this was not from the mouse (e.g. keydown),
				// if `width` is left unspecified a subsequent drag gesture applies a fixed
				// width and the pane fails to widen/narrow with parent width changes from
				// sidebars opening/closing or window resizes.
				width: 'auto',
			} );
		}
	};

	if ( ! hasAnyVisible ) {
		return;
	}

	const contents = (
		<div
			className={ clsx(
				// The class name 'edit-post-layout__metaboxes' is retained because some plugins use it.
				'edit-post-layout__metaboxes',
				! isLegacy && 'edit-post-meta-boxes-main__liner'
			) }
			hidden={ ! isLegacy && isShort && ! isOpen }
		>
			<MetaBoxes location="normal" />
			<MetaBoxes location="advanced" />
		</div>
	);

	if ( isLegacy ) {
		return contents;
	}

	const isAutoHeight = openHeight === undefined;
	let usedMax = '50%'; // Approximation before max has a value.
	if ( max !== undefined ) {
		// Halves the available max height until a user height is set.
		usedMax = isAutoHeight && isUntouched ? max / 2 : max;
	}

	const getAriaValueNow = ( height ) =>
		Math.round( ( ( height - min ) / ( max - min ) ) * 100 );
	const usedAriaValueNow =
		max === undefined || isAutoHeight ? 50 : getAriaValueNow( openHeight );

	const toggle = () =>
		setPreference( 'core/edit-post', 'metaBoxesMainIsOpen', ! isOpen );

	// TODO: Support more/all keyboard interactions from the window splitter pattern:
	// https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
	const onSeparatorKeyDown = ( event ) => {
		const delta = { ArrowUp: 20, ArrowDown: -20 }[ event.key ];
		if ( delta ) {
			const pane = metaBoxesMainRef.current.resizable;
			const fromHeight = isAutoHeight ? pane.offsetHeight : openHeight;
			const nextHeight = delta + fromHeight;
			applyHeight( nextHeight, true, true );
			event.preventDefault();
		}
	};
	const className = 'edit-post-meta-boxes-main';
	const paneLabel = __( 'Meta Boxes' );
	let Pane, paneProps;
	if ( isShort ) {
		Pane = NavigableRegion;
		paneProps = {
			className: clsx( className, 'is-toggle-only' ),
		};
	} else {
		Pane = ResizableBox;
		paneProps = /** @type {Parameters<typeof ResizableBox>[0]} */ ( {
			as: NavigableRegion,
			ref: metaBoxesMainRef,
			className: clsx( className, 'is-resizable' ),
			defaultSize: { height: openHeight },
			minHeight: min,
			maxHeight: usedMax,
			enable: {
				top: true,
				right: false,
				bottom: false,
				left: false,
				topLeft: false,
				topRight: false,
				bottomRight: false,
				bottomLeft: false,
			},
			handleClasses: { top: 'edit-post-meta-boxes-main__presenter' },
			handleComponent: {
				top: (
					<>
						<Tooltip text={ __( 'Drag to resize' ) }>
							<button // eslint-disable-line jsx-a11y/role-supports-aria-props
								ref={ separatorRef }
								role="separator" // eslint-disable-line jsx-a11y/no-interactive-element-to-noninteractive-role
								aria-valuenow={ usedAriaValueNow }
								aria-label={ __( 'Drag to resize' ) }
								aria-describedby={ separatorHelpId }
								onKeyDown={ onSeparatorKeyDown }
							/>
						</Tooltip>
						<VisuallyHidden id={ separatorHelpId }>
							{ __(
								'Use up and down arrow keys to resize the metabox pane.'
							) }
						</VisuallyHidden>
					</>
				),
			},
			// Avoids hiccups while dragging over objects like iframes and ensures that
			// the event to end the drag is captured by the target (resize handle)
			// whether or not it’s under the pointer.
			onPointerDown: ( { pointerId, target } ) => {
				target.setPointerCapture( pointerId );
			},
			onResizeStart: ( event, direction, elementRef ) => {
				if ( isAutoHeight ) {
					// Sets the starting height to avoid visual jumps in height and
					// aria-valuenow being `NaN` for the first (few) resize events.
					applyHeight( elementRef.offsetHeight, false, true );
					setIsUntouched( false );
				}
			},
			onResize: () =>
				applyHeight( metaBoxesMainRef.current.state.height ),
			onResizeStop: () =>
				applyHeight( metaBoxesMainRef.current.state.height, true ),
		} );
	}

	return (
		<Pane aria-label={ paneLabel } { ...paneProps }>
			{ isShort ? (
				<button
					aria-expanded={ isOpen }
					className="edit-post-meta-boxes-main__presenter"
					onClick={ toggle }
				>
					{ paneLabel }
					<Icon icon={ isOpen ? chevronUp : chevronDown } />
				</button>
			) : (
				<meta ref={ effectSizeConstraints } />
			) }
			{ contents }
		</Pane>
	);
}

function Layout( {
	postId: initialPostId,
	postType: initialPostType,
	settings,
	initialEdits,
} ) {
	useCommands();
	useEditPostCommands();
	const shouldIframe = useShouldIframe();
	const { createErrorNotice } = useDispatch( noticesStore );
	const {
		currentPost: { postId: currentPostId, postType: currentPostType },
		onNavigateToEntityRecord,
		onNavigateToPreviousEntityRecord,
	} = useNavigateToEntityRecord(
		initialPostId,
		initialPostType,
		'post-only'
	);
	const isEditingTemplate = currentPostType === 'wp_template';
	const {
		mode,
		isFullscreenActive,
		hasActiveMetaboxes,
		hasBlockSelected,
		showIconLabels,
		isDistractionFree,
		showMetaBoxes,
		hasHistory,
		isWelcomeGuideVisible,
		templateId,
		enablePaddingAppender,
	} = useSelect(
		( select ) => {
			const { get } = select( preferencesStore );
			const { isFeatureActive, getEditedPostTemplateId } = unlock(
				select( editPostStore )
			);
			const { canUser, getPostType } = select( coreStore );

			const supportsTemplateMode = settings.supportsTemplateMode;
			const isViewable =
				getPostType( currentPostType )?.viewable ?? false;
			const canViewTemplate = canUser( 'read', {
				kind: 'postType',
				name: 'wp_template',
			} );
			const { __unstableGetEditorMode } = select( blockEditorStore );
			const { getEditorMode, getRenderingMode } = select( editorStore );
			const isRenderingPostOnly = getRenderingMode() === 'post-only';

			return {
				mode: getEditorMode(),
				isFullscreenActive:
					select( editPostStore ).isFeatureActive( 'fullscreenMode' ),
				hasActiveMetaboxes: select( editPostStore ).hasMetaBoxes(),
				hasBlockSelected:
					!! select( blockEditorStore ).getBlockSelectionStart(),
				showIconLabels: get( 'core', 'showIconLabels' ),
				isDistractionFree: get( 'core', 'distractionFree' ),
				showMetaBoxes:
					! DESIGN_POST_TYPES.includes( currentPostType ) &&
					isRenderingPostOnly,
				isWelcomeGuideVisible: isFeatureActive( 'welcomeGuide' ),
				templateId:
					supportsTemplateMode &&
					isViewable &&
					canViewTemplate &&
					! isEditingTemplate
						? getEditedPostTemplateId()
						: null,
				enablePaddingAppender:
					__unstableGetEditorMode() !== 'zoom-out' &&
					isRenderingPostOnly &&
					! DESIGN_POST_TYPES.includes( currentPostType ),
			};
		},
		[ currentPostType, isEditingTemplate, settings.supportsTemplateMode ]
	);
	const [ paddingAppenderRef, paddingStyle ] = usePaddingAppender(
		enablePaddingAppender
	);

	// Set the right context for the command palette
	const commandContext = hasBlockSelected
		? 'block-selection-edit'
		: 'entity-edit';
	useCommandContext( commandContext );
	const editorSettings = useMemo(
		() => ( {
			...settings,
			onNavigateToEntityRecord,
			onNavigateToPreviousEntityRecord,
			defaultRenderingMode: 'post-only',
		} ),
		[ settings, onNavigateToEntityRecord, onNavigateToPreviousEntityRecord ]
	);
	const styles = useEditorStyles( paddingStyle );

	// We need to add the show-icon-labels class to the body element so it is applied to modals.
	if ( showIconLabels ) {
		document.body.classList.add( 'show-icon-labels' );
	} else {
		document.body.classList.remove( 'show-icon-labels' );
	}

	const navigateRegionsProps = useNavigateRegions();

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
								decodeEntities( title )
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

	const initialPost = useMemo( () => {
		return {
			type: initialPostType,
			id: initialPostId,
		};
	}, [ initialPostType, initialPostId ] );

	const backButton =
		useViewportMatch( 'medium' ) && isFullscreenActive ? (
			<BackButton initialPost={ initialPost } />
		) : null;

	return (
		<SlotFillProvider>
			<ErrorBoundary>
				<CommandMenu />
				<WelcomeGuide postType={ currentPostType } />
				<div
					className={ navigateRegionsProps.className }
					{ ...navigateRegionsProps }
					ref={ navigateRegionsProps.ref }
				>
					<Editor
						settings={ editorSettings }
						initialEdits={ initialEdits }
						postType={ currentPostType }
						postId={ currentPostId }
						templateId={ templateId }
						className={ className }
						styles={ styles }
						forceIsDirty={ hasActiveMetaboxes }
						contentRef={ paddingAppenderRef }
						disableIframe={ ! shouldIframe }
						// We should auto-focus the canvas (title) on load.
						// eslint-disable-next-line jsx-a11y/no-autofocus
						autoFocus={ ! isWelcomeGuideVisible }
						onActionPerformed={ onActionPerformed }
						extraSidebarPanels={
							showMetaBoxes && <MetaBoxes location="side" />
						}
						extraContent={
							! isDistractionFree &&
							showMetaBoxes && (
								<MetaBoxesMain isLegacy={ ! shouldIframe } />
							)
						}
					>
						<PostLockedModal />
						<EditorInitialization />
						<FullscreenMode isActive={ isFullscreenActive } />
						<BrowserURL hasHistory={ hasHistory } />
						<UnsavedChangesWarning />
						<AutosaveMonitor />
						<LocalAutosaveMonitor />
						<EditPostKeyboardShortcuts />
						<EditorKeyboardShortcutsRegister />
						<BlockKeyboardShortcuts />
						<InitPatternModal />
						<PluginArea onError={ onPluginAreaError } />
						<PostEditorMoreMenu />
						{ backButton }
						<EditorSnackbars />
					</Editor>
				</div>
			</ErrorBoundary>
		</SlotFillProvider>
	);
}

export default Layout;
