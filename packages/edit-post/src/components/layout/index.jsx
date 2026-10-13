import clsx from 'clsx';
import { NavigableRegion, getAdminThemeColors } from '@wordpress/admin-ui';
import {
	AutosaveMonitor,
	LocalAutosaveMonitor,
	UnsavedChangesWarning,
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
import { SnackbarNotices, store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { privateApis as commandsPrivateApis } from '@wordpress/commands';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';
import {
	Icon as WCIcon,
	SlotFillProvider,
	__unstableUseNavigateRegions as useNavigateRegions,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import {
	useMediaQuery,
	useMergeRefs,
	useRefEffect,
	useViewportMatch,
} from '@wordpress/compose';
import { ThemeProvider } from '@wordpress/theme';
import { Tooltip, VisuallyHidden } from '@wordpress/ui';
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
import useNavigateToEntityRecord from '../../hooks/use-navigate-to-entity-record';
import { useMetaBoxInitialization } from '../meta-boxes/use-meta-box-initialization';

const { useCommandContext } = unlock( commandsPrivateApis );
/** @type {{} & {useDrag: import('@use-gesture/react').useDrag}} */
const { useDrag } = unlock( componentsPrivateApis );
const { Editor, FullscreenMode, UploadProgressSnackbar } =
	unlock( editorPrivateApis );
const DESIGN_POST_TYPES = [
	'wp_template',
	'wp_template_part',
	'wp_block',
	'wp_navigation',
];

function useEditorStyles( settings ) {
	const { hasThemeStyleSupport } = useSelect( ( select ) => {
		return {
			hasThemeStyleSupport:
				select( editPostStore ).isFeatureActive( 'themeStyles' ),
		};
	}, [] );

	// Compute the default styles.
	return useMemo( () => {
		const presetStyles =
			settings.styles?.filter(
				( style ) =>
					style.__unstableType && style.__unstableType !== 'theme'
			) ?? [];

		const defaultEditorStyles = [
			...( settings?.defaultEditorStyles ?? [] ),
			...presetStyles,
		];

		// Has theme styles if the theme supports them and if some styles were not preset styles (in which case they're theme styles).
		const hasThemeStyles =
			hasThemeStyleSupport &&
			presetStyles.length !== ( settings.styles?.length ?? 0 );

		// If theme styles are not present or displayed, ensure that
		// base layout styles are still present in the editor.
		if ( ! settings.disableLayoutStyles && ! hasThemeStyles ) {
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

		return hasThemeStyles ? ( settings.styles ?? [] ) : defaultEditorStyles;
	}, [
		settings.defaultEditorStyles,
		settings.disableLayoutStyles,
		settings.styles,
		hasThemeStyleSupport,
	] );
}

// Opened with no saved height. A percentage resolves against the content
// area before the resize observer has measured it.
const DEFAULT_PINNED_HEIGHT = '50%';
// A saved height is capped on load so the pane cannot cover the canvas.
// Dragging within the session is not capped.
const MAX_RESTORED_HEIGHT = '80%';

function MetaBoxesMain() {
	const [ isOpen, openHeight, isPinnedPreference, hasAnyVisible ] = useSelect(
		( select ) => {
			const { get } = select( preferencesStore );
			const { isMetaBoxLocationVisible } = select( editPostStore );
			return [
				!! get( 'core/edit-post', 'metaBoxesMainIsOpen' ),
				get( 'core/edit-post', 'metaBoxesMainOpenHeight' ),
				get( 'core/edit-post', 'metaBoxesMainIsPinned' ),
				// Sidebar meta boxes render in the settings sidebar. Counting
				// them here showed an empty pane on post types that only
				// register side meta boxes.
				isMetaBoxLocationVisible( 'normal' ) ||
					isMetaBoxLocationVisible( 'advanced' ),
			];
		},
		[]
	);
	const { set: setPreference } = useDispatch( preferencesStore );
	// Users who already saved a pane height stay pinned without a stored flag.
	const isPinned = isPinnedPreference ?? typeof openHeight === 'number';
	// Pixel height from a drag in this session. While set, the 80% restore cap
	// does not apply, including if the pane is collapsed and opened again.
	const [ sessionHeight, setSessionHeight ] = useState();

	// Grow the canvas iframe to its content while meta boxes are inline, so the
	// content area is the only scroller. An inner iframe scrollbar plus the
	// outer one sticks at the handoff and shows both bars. The iframe is
	// mounted after this component, and later replaced, so watch for it.
	useEffect( () => {
		if ( isPinned || ! hasAnyVisible ) {
			return;
		}
		const content = document.querySelector(
			'.interface-interface-skeleton__content'
		);
		if ( ! content ) {
			return;
		}

		let resizeObserver;
		let iframe = null;

		const release = ( frame ) => {
			if ( ! frame ) {
				return;
			}
			frame.style.height = '';
			const doc = frame.contentDocument;
			if ( doc?.documentElement ) {
				doc.documentElement.style.overflow = '';
			}
		};
		const sync = () => {
			const doc = iframe?.contentDocument;
			const body = doc?.body;
			if ( ! iframe || ! body ) {
				return;
			}
			doc.documentElement.style.overflow = 'hidden';
			// In-flow boxes only. The canvas cover is position:absolute and
			// matches the iframe height, and the document's min-height stretches
			// to the iframe, so either of those would grow the frame forever.
			const bodyTop = body.getBoundingClientRect().top;
			let bottom = bodyTop;
			for ( const child of body.children ) {
				const position = window.getComputedStyle( child ).position;
				if ( position === 'absolute' || position === 'fixed' ) {
					continue;
				}
				bottom = Math.max(
					bottom,
					child.getBoundingClientRect().bottom
				);
			}
			const pad =
				parseFloat( window.getComputedStyle( body ).paddingBottom ) ||
				0;
			const next = Math.max(
				Math.ceil( bottom - bodyTop + pad ),
				content.clientHeight
			);
			const nextHeight = `${ next }px`;
			if ( iframe.style.height !== nextHeight ) {
				iframe.style.height = nextHeight;
			}
		};
		const watch = ( next ) => {
			resizeObserver?.disconnect();
			resizeObserver = undefined;
			if ( iframe && iframe !== next ) {
				release( iframe );
			}
			iframe = next;
			const doc = iframe?.contentDocument;
			if ( ! doc?.body ) {
				return;
			}
			resizeObserver = new window.ResizeObserver( sync );
			resizeObserver.observe( doc.documentElement );
			resizeObserver.observe( content );
			sync();
		};
		const find = () =>
			content.querySelector( 'iframe[name="editor-canvas"]' );
		// The same iframe element is reused when its document is replaced.
		const onLoad = ( event ) => {
			if ( event.target === find() ) {
				watch( event.target );
			}
		};

		content.addEventListener( 'load', onLoad, true );
		const mutationObserver = new window.MutationObserver( () => {
			const next = find();
			if ( next !== iframe ) {
				watch( next );
			}
		} );
		mutationObserver.observe( content, {
			childList: true,
			subtree: true,
		} );
		watch( find() );

		return () => {
			content.removeEventListener( 'load', onLoad, true );
			mutationObserver.disconnect();
			resizeObserver?.disconnect();
			release( iframe );
		};
	}, [ isPinned, hasAnyVisible ] );

	const isShort = useMediaQuery( '(max-height: 549px)' );

	const [ { min = 0, max }, setHeightConstraints ] = useState( () => ( {} ) );
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
		const noticeContainer = container.querySelector( '.editor-notices' );
		const resizeHandle = container.querySelector(
			'.edit-post-meta-boxes-main__presenter'
		);
		const deriveConstraints = () => {
			const fullHeight = container.offsetHeight;
			let nextMax = fullHeight;
			if ( noticeContainer ) {
				nextMax -= noticeContainer.offsetHeight;
			}
			const nextMin = resizeHandle?.offsetHeight ?? 0;
			setHeightConstraints( { min: nextMin, max: nextMax } );
		};
		const observer = new window.ResizeObserver( deriveConstraints );
		observer.observe( container );
		if ( noticeContainer ) {
			observer.observe( noticeContainer );
		}
		return () => observer.disconnect();
	}, [] );
	const metaBoxesMainRef = useRef();
	const setMainRefs = useMergeRefs( [
		metaBoxesMainRef,
		effectSizeConstraints,
	] );

	const separatorRef = useRef();
	const separatorHelpId = useId();

	const heightRef = useRef();

	const getAriaValueNow = ( height ) =>
		Math.round( ( ( height - min ) / ( max - min ) ) * 100 );
	const persistIsOpen = ( to = ! isOpen ) =>
		setPreference( 'core/edit-post', 'metaBoxesMainIsOpen', to );

	/**
	 * @param {number|'auto'} [candidateHeight] Height in pixels or 'auto'.
	 * @param {boolean}       isPersistent      Whether to persist the height in preferences.
	 */
	const applyHeight = ( candidateHeight = 'auto', isPersistent ) => {
		let styleHeight;
		if ( candidateHeight === 'auto' ) {
			isPersistent = false; // Just in case — “auto” should never persist.
			styleHeight = candidateHeight;
		} else {
			candidateHeight = Math.min( max, Math.max( min, candidateHeight ) );
			heightRef.current = candidateHeight;
			styleHeight = `${ candidateHeight }px`;
		}
		if ( isPersistent ) {
			setPreference(
				'core/edit-post',
				'metaBoxesMainOpenHeight',
				candidateHeight
			);
		}
		// Applies imperative DOM updates only when not persisting the value
		// because otherwise it's done by the subsequent render.
		else {
			metaBoxesMainRef.current.style.height = styleHeight;
			if ( ! isShort ) {
				separatorRef.current.ariaValueNow =
					getAriaValueNow( candidateHeight );
			}
		}
	};

	// useDrag includes keyboard support with arrow keys emulating a drag.
	// TODO: Support more/all keyboard interactions from the window splitter pattern:
	// https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
	const bindDragGesture = useDrag(
		( { movement, first, last, memo, tap, args } ) => {
			const pane = metaBoxesMainRef.current;
			const [ , yMovement ] = movement;
			if ( first ) {
				pane.classList.add( 'is-resizing' );
				let fromHeight = heightRef.current ?? pane.offsetHeight;
				if ( isOpen ) {
					// Starts from max in case shortening the window has imposed it.
					if ( fromHeight > max ) {
						fromHeight = max;
					}
				} else {
					fromHeight = min;
				}
				applyHeight( fromHeight - yMovement );
				return { fromHeight };
			}

			if ( ! first && ! last && ! tap ) {
				applyHeight( memo.fromHeight - yMovement );
				return memo;
			}
			// Here, `last === true` – it’s the final event of the gesture.

			pane.classList.remove( 'is-resizing' );
			if ( tap ) {
				const [ onTap ] = args;
				onTap?.();
				return;
			}
			// A drag this session may exceed the 80% restore cap.
			setSessionHeight( heightRef.current );
			const nextIsOpen = heightRef.current > min;
			persistIsOpen( nextIsOpen );
			// Persists height only if still open. This is so that when closed by a drag the
			// prior height can be restored by the toggle button instead of having to drag
			// the pane open again.
			applyHeight( heightRef.current, nextIsOpen );
		},
		{ keyboardDisplacement: 20, filterTaps: true }
	);

	if ( ! hasAnyVisible ) {
		return;
	}

	const contents = (
		<div
			// The class name 'edit-post-layout__metaboxes' is retained because some plugins use it.
			className="edit-post-layout__metaboxes edit-post-meta-boxes-main__liner"
			// Inline meta boxes stay in the scroll area, so they are never hidden.
			hidden={ isPinned ? ! isOpen : undefined }
		>
			<MetaBoxes location="normal" />
			<MetaBoxes location="advanced" />
		</div>
	);

	let usedHeight;
	if ( isPinned ) {
		if ( ! isOpen ) {
			usedHeight = min;
		} else if ( typeof sessionHeight === 'number' ) {
			usedHeight = sessionHeight;
		} else if ( typeof openHeight === 'number' ) {
			usedHeight = `min(${ openHeight }px, ${ MAX_RESTORED_HEIGHT })`;
		} else {
			usedHeight = DEFAULT_PINNED_HEIGHT;
		}
	}

	const usedAriaValueNow = ( () => {
		if ( max === undefined || ! isPinned || ! isOpen ) {
			return 50;
		}
		if ( typeof openHeight !== 'number' ) {
			return 50;
		}
		const restored =
			typeof sessionHeight === 'number'
				? sessionHeight
				: Math.min( openHeight, max * 0.8 );
		return getAriaValueNow( restored );
	} )();

	const paneLabel = __( 'Meta Boxes' );
	const pinToBottom = () => {
		setPreference( 'core/edit-post', 'metaBoxesMainIsPinned', true );
		setPreference( 'core/edit-post', 'metaBoxesMainIsOpen', true );
	};
	const unpin = () => {
		setPreference( 'core/edit-post', 'metaBoxesMainIsPinned', false );
	};

	// The toggle button. It also resizes when the viewport is tall to provide
	// a larger hit area than the small separator button.
	const toggle = (
		<button
			aria-expanded={ isOpen }
			// Toggles for all clicks when short and only keyboard “clicks” when
			// resizable because pointer input is handled by the drag gesture.
			onClick={ ( { detail } ) => {
				if ( isShort || ! detail ) {
					persistIsOpen();
				}
			} }
			// Passes a toggle callback that the drag gesture handler calls when
			// it interprets the input as a click/tap.
			{ ...( ! isShort && bindDragGesture( persistIsOpen ) ) }
		>
			{ paneLabel }
			<WCIcon icon={ isOpen ? chevronUp : chevronDown } />
		</button>
	);

	// The separator button that provides a11y for resizing.
	const separator = isPinned && ! isShort && (
		<>
			<Tooltip.Root>
				<Tooltip.Trigger
					render={
						<button
							ref={ separatorRef }
							role="separator" // eslint-disable-line jsx-a11y/no-interactive-element-to-noninteractive-role
							aria-valuenow={ usedAriaValueNow }
							aria-label={ __( 'Drag to resize' ) }
							aria-describedby={ separatorHelpId }
							{ ...bindDragGesture() }
						/>
					}
				/>
				<Tooltip.Popup>{ __( 'Drag to resize' ) }</Tooltip.Popup>
			</Tooltip.Root>
			<VisuallyHidden id={ separatorHelpId }>
				{ __(
					'Use up and down arrow keys to resize the meta box pane.'
				) }
			</VisuallyHidden>
		</>
	);

	return (
		<NavigableRegion
			ariaLabel={ paneLabel }
			ref={ setMainRefs }
			className={ clsx(
				'edit-post-meta-boxes-main',
				isPinned ? 'is-pinned' : 'is-inline',
				isPinned && ! isShort && 'is-resizable'
			) }
			style={ isPinned ? { height: usedHeight } : undefined }
		>
			<div className="edit-post-meta-boxes-main__presenter">
				{ isPinned ? (
					<>
						{ toggle }
						<button
							type="button"
							className="edit-post-meta-boxes-main__pin"
							onClick={ unpin }
						>
							{ __( 'Unpin' ) }
						</button>
						{ separator }
					</>
				) : (
					<>
						<span className="edit-post-meta-boxes-main__label">
							{ paneLabel }
						</span>
						<button
							type="button"
							className="edit-post-meta-boxes-main__pin"
							onClick={ pinToBottom }
						>
							{ __( 'Pin to bottom' ) }
						</button>
					</>
				) }
			</div>
			{ contents }
		</NavigableRegion>
	);
}

function Layout( {
	postId: initialPostId,
	postType: initialPostType,
	settings,
	initialEdits,
} ) {
	useEditPostCommands();
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
			const { getEditorMode, getDefaultRenderingMode } = unlock(
				select( editorStore )
			);
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

	// Set the right context for the command palette
	const commandContext = hasBlockSelected
		? 'block-selection-edit'
		: 'entity-edit';
	useCommandContext( commandContext );
	const styles = useEditorStyles( settings );
	const editorSettings = useMemo(
		() => ( {
			...settings,
			styles,
			onNavigateToEntityRecord,
			onNavigateToPreviousEntityRecord,
		} ),
		[
			settings,
			styles,
			onNavigateToEntityRecord,
			onNavigateToPreviousEntityRecord,
		]
	);

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
				case 'permanently-delete':
					{
						document.location.href = addQueryArgs( 'edit.php', {
							deleted: 1,
							post_type: items[ 0 ].type,
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

	const adminPrimary = useMemo( () => getAdminThemeColors().primary, [] );

	return (
		<SlotFillProvider>
			<Tooltip.Provider>
				<ThemeProvider isRoot color={ { primary: adminPrimary } }>
					<ErrorBoundary canCopyContent>
						<WelcomeGuide postType={ currentPostType } />
						<div { ...navigateRegionsProps }>
							<Editor
								settings={ editorSettings }
								initialEdits={ initialEdits }
								postType={ currentPostType }
								postId={ currentPostId }
								templateId={ templateId }
								className={ className }
								forceIsDirty={ hasActiveMetaboxes }
								// We should auto-focus the canvas (title) on load.
								// eslint-disable-next-line jsx-a11y/no-autofocus
								autoFocus={ ! isWelcomeGuideVisible }
								onActionPerformed={ onActionPerformed }
								extraSidebarPanels={
									showMetaBoxes && (
										<MetaBoxes location="side" />
									)
								}
								extraContent={
									! isDistractionFree &&
									showMetaBoxes && <MetaBoxesMain />
								}
							>
								<PostLockedModal />
								<EditorInitialization />
								<FullscreenMode
									isActive={ isFullscreenActive }
								/>
								<BrowserURL />
								<UnsavedChangesWarning />
								<AutosaveMonitor />
								<LocalAutosaveMonitor />
								<EditPostKeyboardShortcuts />
								{ currentPostType === 'wp_block' && (
									<InitPatternModal />
								) }
								<PluginArea onError={ onPluginAreaError } />
								<PostEditorMoreMenu />
								{ backButton }
								<SnackbarNotices className="edit-post-layout__snackbar" />
								<UploadProgressSnackbar />
							</Editor>
						</div>
					</ErrorBoundary>
				</ThemeProvider>
			</Tooltip.Provider>
		</SlotFillProvider>
	);
}

export default Layout;
