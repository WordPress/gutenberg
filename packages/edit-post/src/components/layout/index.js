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
	SlotFillProvider,
	Tooltip,
	VisuallyHidden,
	__unstableUseNavigateRegions as useNavigateRegions,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import {
	useMediaQuery,
	useMergeRefs,
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
import { useShouldIframe } from './use-should-iframe';
import useNavigateToEntityRecord from '../../hooks/use-navigate-to-entity-record';
import { useMetaBoxInitialization } from '../meta-boxes/use-meta-box-initialization';

const { useCommandContext } = unlock( commandsPrivateApis );
/** @type {{} & {useDrag: import('@use-gesture/react').useDrag}} */
const { useDrag } = unlock( componentsPrivateApis );
const { Editor, FullscreenMode } = unlock( editorPrivateApis );
const { BlockKeyboardShortcuts } = unlock( blockLibraryPrivateApis );
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

		return hasThemeStyles ? settings.styles ?? [] : defaultEditorStyles;
	}, [
		settings.defaultEditorStyles,
		settings.disableLayoutStyles,
		settings.styles,
		hasThemeStyleSupport,
	] );
}

/**
 * @param {Object}  props
 * @param {boolean} props.isLegacy True for device previews where split view is disabled.
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
	const metaBoxesMainRef = useRef();
	const setMainRefs = useMergeRefs( [
		metaBoxesMainRef,
		effectSizeConstraints,
	] );

	const separatorRef = useRef();
	const separatorHelpId = useId();

	const heightRef = useRef();

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
	const usedOpenHeight = isShort ? 'auto' : openHeight;
	const usedHeight = isOpen ? usedOpenHeight : min;

	const getAriaValueNow = ( height ) =>
		Math.round( ( ( height - min ) / ( max - min ) ) * 100 );
	const usedAriaValueNow =
		max === undefined || isAutoHeight ? 50 : getAriaValueNow( usedHeight );

	const persistIsOpen = ( to = ! isOpen ) =>
		setPreference( 'core/edit-post', 'metaBoxesMainIsOpen', to );

	const paneLabel = __( 'Meta Boxes' );

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
			<Icon icon={ isOpen ? chevronUp : chevronDown } />
		</button>
	);

	// The separator button that provides a11y for resizing.
	const separator = ! isShort && (
		<>
			<Tooltip text={ __( 'Drag to resize' ) }>
				<button // eslint-disable-line jsx-a11y/role-supports-aria-props
					ref={ separatorRef }
					role="separator" // eslint-disable-line jsx-a11y/no-interactive-element-to-noninteractive-role
					aria-valuenow={ usedAriaValueNow }
					aria-label={ __( 'Drag to resize' ) }
					aria-describedby={ separatorHelpId }
					{ ...bindDragGesture() }
				/>
			</Tooltip>
			<VisuallyHidden id={ separatorHelpId }>
				{ __(
					'Use up and down arrow keys to resize the meta box pane.'
				) }
			</VisuallyHidden>
		</>
	);

	return (
		<NavigableRegion
			aria-label={ paneLabel }
			ref={ setMainRefs }
			className={ clsx(
				'edit-post-meta-boxes-main',
				! isShort && 'is-resizable'
			) }
			style={ { height: usedHeight } }
		>
			<div className="edit-post-meta-boxes-main__presenter">
				{ toggle }
				{ separator }
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
	const shouldIframe = useShouldIframe();
	const { createErrorNotice } = useDispatch( noticesStore );
	const {
		currentPost: { postId: currentPostId, postType: currentPostType },
		onNavigateToEntityRecord,
		onNavigateToPreviousEntityRecord,
		previousSelectedBlockPath,
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
			const { getEditorMode, getDefaultRenderingMode, getDeviceType } =
				unlock( select( editorStore ) );
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
			defaultRenderingMode: 'post-only',
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
						forceIsDirty={ hasActiveMetaboxes }
						disableIframe={ ! shouldIframe }
						// We should auto-focus the canvas (title) on load.
						// eslint-disable-next-line jsx-a11y/no-autofocus
						autoFocus={ ! isWelcomeGuideVisible }
						onActionPerformed={ onActionPerformed }
						initialSelection={ previousSelectedBlockPath }
						extraSidebarPanels={
							showMetaBoxes && <MetaBoxes location="side" />
						}
						extraContent={
							! isDistractionFree &&
							showMetaBoxes && (
								<MetaBoxesMain isLegacy={ isDevicePreview } />
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
						{ currentPostType === 'wp_block' && (
							<InitPatternModal />
						) }
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
