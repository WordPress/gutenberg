/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { NavigableRegion } from '@wordpress/admin-ui';
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
import { store as blockEditorStore } from '@wordpress/block-editor';
import { getLayoutStyles } from '@wordpress/global-styles-engine';
import { PluginArea } from '@wordpress/plugins';
import { __, sprintf } from '@wordpress/i18n';
import {
	useCallback,
	useEffect,
	useMemo,
	useId,
	useRef,
	useState,
} from '@wordpress/element';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { privateApis as commandsPrivateApis } from '@wordpress/commands';
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
	useEvent,
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
import { useMetaBoxInitialization } from '../meta-boxes/use-meta-box-initialization';

const { useCommandContext } = unlock( commandsPrivateApis );
const { Editor, FullscreenMode } = unlock( editorPrivateApis );
const { BlockKeyboardShortcuts } = unlock( blockLibraryPrivateApis );
const DESIGN_POST_TYPES = [
	'wp_template',
	'wp_template_part',
	'wp_block',
	'wp_navigation',
	'wp_registered_template',
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
			!! get( 'core/edit-post', 'metaBoxesMainIsOpen' ),
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
	// aria-valuenow attribute on the separator.
	const effectSizeConstraints = useRefEffect( ( node ) => {
		const container = node.closest(
			'.interface-interface-skeleton__content'
		);
		if ( ! container ) {
			return;
		}
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

	const resizeDataRef = useRef( {} );
	const separatorRef = useRef();
	const separatorHelpId = useId();

	/**
	 * @param {number|'auto'} [candidateHeight] Height in pixels or 'auto'.
	 * @param {boolean}       isPersistent      Whether to persist the height in preferences.
	 * @param {boolean}       isInstant         Whether to update the height in the DOM.
	 */
	const applyHeight = (
		candidateHeight = 'auto',
		isPersistent,
		isInstant
	) => {
		if ( candidateHeight === 'auto' ) {
			isPersistent = false; // Just in case — “auto” should never persist.
		} else {
			candidateHeight = Math.min( max, Math.max( min, candidateHeight ) );
		}
		if ( isPersistent ) {
			setPreference(
				'core/edit-post',
				'metaBoxesMainOpenHeight',
				candidateHeight
			);
		}
		// Updates aria-valuenow only when not persisting the value because otherwise
		// it's done by the render that persisting the value causes.
		else if ( ! isShort ) {
			separatorRef.current.ariaValueNow =
				getAriaValueNow( candidateHeight );
		}
		if ( isInstant ) {
			metaBoxesMainRef.current.updateSize( {
				height: candidateHeight,
				// Oddly, when the event that triggered this was not from the mouse (e.g. keydown),
				// if `width` is left unspecified a subsequent drag gesture applies a fixed
				// width and the pane fails to widen/narrow with parent width changes from
				// sidebars opening/closing or window resizes.
				width: 'auto',
			} );
		}
	};
	const getRenderValues = useEvent( () => ( { isOpen, openHeight, min } ) );
	// Sets the height to 'auto' when not resizable (isShort) and to the
	// preferred height when resizable.
	useEffect( () => {
		const fresh = getRenderValues();
		// Tests for `min` having a value to skip the first render.
		if ( fresh.min !== undefined && metaBoxesMainRef.current ) {
			const usedOpenHeight = isShort ? 'auto' : fresh.openHeight;
			const usedHeight = fresh.isOpen ? usedOpenHeight : fresh.min;
			applyHeight( usedHeight, false, true );
		}
	}, [ isShort ] );

	if ( ! hasAnyVisible ) {
		return;
	}

	const contents = (
		<div
			// The class name 'edit-post-layout__metaboxes' is retained because some plugins use it.
			className="edit-post-layout__metaboxes edit-post-meta-boxes-main__liner"
			hidden={ ! isLegacy && ! isOpen }
		>
			<MetaBoxes location="normal" />
			<MetaBoxes location="advanced" />
		</div>
	);

	if ( isLegacy ) {
		return contents;
	}

	const isAutoHeight = openHeight === undefined;
	const getAriaValueNow = ( height ) =>
		Math.round( ( ( height - min ) / ( max - min ) ) * 100 );
	const usedAriaValueNow =
		max === undefined || isAutoHeight ? 50 : getAriaValueNow( openHeight );

	const persistIsOpen = ( to = ! isOpen ) =>
		setPreference( 'core/edit-post', 'metaBoxesMainIsOpen', to );

	// TODO: Support more/all keyboard interactions from the window splitter pattern:
	// https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
	const onSeparatorKeyDown = ( event ) => {
		const delta = { ArrowUp: 20, ArrowDown: -20 }[ event.key ];
		if ( delta ) {
			const pane = metaBoxesMainRef.current.resizable;
			const fromHeight = isAutoHeight ? pane.offsetHeight : openHeight;
			const nextHeight = delta + fromHeight;
			applyHeight( nextHeight, true, true );
			persistIsOpen( nextHeight > min );
			event.preventDefault();
		}
	};
	const paneLabel = __( 'Meta Boxes' );

	const toggle = (
		<button
			aria-expanded={ isOpen }
			onClick={ ( { detail } ) => {
				const { isToggleInferred } = resizeDataRef.current;
				if ( isShort || ! detail || isToggleInferred ) {
					persistIsOpen();
					const usedOpenHeight = isShort ? 'auto' : openHeight;
					const usedHeight = isOpen ? min : usedOpenHeight;
					applyHeight( usedHeight, false, true );
				}
			} }
			// Prevents resizing in short viewports.
			{ ...( isShort && {
				onMouseDown: ( event ) => event.stopPropagation(),
				onTouchStart: ( event ) => event.stopPropagation(),
			} ) }
		>
			{ paneLabel }
			<Icon icon={ isOpen ? chevronUp : chevronDown } />
		</button>
	);

	const separator = ! isShort && (
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
					'Use up and down arrow keys to resize the meta box panel.'
				) }
			</VisuallyHidden>
		</>
	);

	const paneProps = /** @type {Parameters<typeof ResizableBox>[0]} */ ( {
		as: NavigableRegion,
		ref: metaBoxesMainRef,
		className: 'edit-post-meta-boxes-main',
		defaultSize: { height: isOpen ? openHeight : 0 },
		minHeight: min,
		maxHeight: max,
		enable: { top: true },
		handleClasses: { top: 'edit-post-meta-boxes-main__presenter' },
		handleComponent: {
			top: (
				<>
					{ toggle }
					{ separator }
				</>
			),
		},
		// Avoids hiccups while dragging over objects like iframes and ensures that
		// the event to end the drag is captured by the target (resize handle)
		// whether or not it’s under the pointer.
		onPointerDown: ( { pointerId, target } ) => {
			if ( separatorRef.current?.parentElement.contains( target ) ) {
				target.setPointerCapture( pointerId );
			}
		},
		onResizeStart: ( { timeStamp }, direction, elementRef ) => {
			if ( isAutoHeight ) {
				// Sets the starting height to avoid visual jumps in height and
				// aria-valuenow being `NaN` for the first (few) resize events.
				applyHeight( elementRef.offsetHeight, false, true );
			}
			elementRef.classList.add( 'is-resizing' );
			resizeDataRef.current = { timeStamp, maxDelta: 0 };
		},
		onResize: ( event, direction, elementRef, delta ) => {
			const { maxDelta } = resizeDataRef.current;
			const newDelta = Math.abs( delta.height );
			resizeDataRef.current.maxDelta = Math.max( maxDelta, newDelta );
			applyHeight( metaBoxesMainRef.current.state.height );
		},
		onResizeStop: ( event, direction, elementRef ) => {
			elementRef.classList.remove( 'is-resizing' );
			const duration = event.timeStamp - resizeDataRef.current.timeStamp;
			const wasSeparator = event.target === separatorRef.current;
			const { maxDelta } = resizeDataRef.current;
			const isToggleInferred =
				maxDelta < 1 || ( duration < 144 && maxDelta < 5 );
			if ( isShort || ( ! wasSeparator && isToggleInferred ) ) {
				resizeDataRef.current.isToggleInferred = true;
			} else {
				const { height } = metaBoxesMainRef.current.state;
				const nextIsOpen = height > min;
				persistIsOpen( nextIsOpen );
				// Persists height only if still open. This is so that when closed by a drag the
				// prior height can be restored by the toggle button instead of having to drag
				// the pane open again. Also, if already closed, a click on the separator won’t
				// persist the height as the minimum.
				if ( nextIsOpen ) {
					applyHeight( height, true );
				}
			}
		},
	} );

	return (
		<ResizableBox aria-label={ paneLabel } { ...paneProps }>
			<meta ref={ effectSizeConstraints } />
			{ contents }
		</ResizableBox>
	);
}

function Layout( {
	postId: initialPostId,
	postType: initialPostType,
	settings,
	initialEdits,
} ) {
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
		hasResolvedMode,
		hasActiveMetaboxes,
		hasBlockSelected,
		showIconLabels,
		isDistractionFree,
		showMetaBoxes,
		isWelcomeGuideVisible,
		templateId,
		enablePaddingAppender,
		isDevicePreview,
	} = useSelect(
		( select ) => {
			const { get } = select( preferencesStore );
			const { isFeatureActive, hasMetaBoxes } = select( editPostStore );
			const { canUser, getPostType, getTemplateId } = unlock(
				select( coreStore )
			);

			const supportsTemplateMode = settings.supportsTemplateMode;
			const isViewable =
				getPostType( currentPostType )?.viewable ?? false;
			const canViewTemplate = canUser( 'read', {
				kind: 'postType',
				name: 'wp_template',
			} );
			const { getBlockSelectionStart, isZoomOut } = unlock(
				select( blockEditorStore )
			);
			const {
				getEditorMode,
				getRenderingMode,
				getDefaultRenderingMode,
				getDeviceType,
			} = unlock( select( editorStore ) );
			const isRenderingPostOnly = getRenderingMode() === 'post-only';
			const isNotDesignPostType =
				! DESIGN_POST_TYPES.includes( currentPostType );
			const isDirectlyEditingPattern =
				currentPostType === 'wp_block' &&
				! onNavigateToPreviousEntityRecord;
			const _templateId = getTemplateId( currentPostType, currentPostId );
			const defaultMode = getDefaultRenderingMode( currentPostType );

			return {
				mode: getEditorMode(),
				isFullscreenActive: isFeatureActive( 'fullscreenMode' ),
				hasActiveMetaboxes: hasMetaBoxes(),
				hasResolvedMode:
					defaultMode === 'template-locked'
						? !! _templateId
						: defaultMode !== undefined,
				hasBlockSelected: !! getBlockSelectionStart(),
				showIconLabels: get( 'core', 'showIconLabels' ),
				isDistractionFree: get( 'core', 'distractionFree' ),
				showMetaBoxes:
					( isNotDesignPostType && ! isZoomOut() ) ||
					isDirectlyEditingPattern,
				isWelcomeGuideVisible: isFeatureActive( 'welcomeGuide' ),
				templateId:
					supportsTemplateMode &&
					isViewable &&
					canViewTemplate &&
					! isEditingTemplate
						? _templateId
						: null,
				enablePaddingAppender:
					! isZoomOut() && isRenderingPostOnly && isNotDesignPostType,
				isDevicePreview: getDeviceType() !== 'Desktop',
			};
		},
		[
			currentPostType,
			currentPostId,
			isEditingTemplate,
			settings.supportsTemplateMode,
			onNavigateToPreviousEntityRecord,
		]
	);

	useMetaBoxInitialization( hasActiveMetaboxes && hasResolvedMode );

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
								// translators: %s: Title of the created post or template, e.g: "Hello world".
								__( '"%s" successfully created.' ),
								decodeEntities( title ) || __( '(no title)' )
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
			<ErrorBoundary canCopyContent>
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
								<MetaBoxesMain
									isLegacy={
										! shouldIframe || isDevicePreview
									}
								/>
							)
						}
					>
						<PostLockedModal />
						<EditorInitialization />
						<FullscreenMode isActive={ isFullscreenActive } />
						<BrowserURL />
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
