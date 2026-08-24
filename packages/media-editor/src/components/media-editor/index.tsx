import clsx from 'clsx';
import {
	Button,
	Spinner,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { Stack, Tabs, Text } from '@wordpress/ui';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { NavigableRegion } from '@wordpress/admin-ui';
import {
	createContext,
	createPortal,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import {
	close,
	drawerLeft,
	drawerRight,
	keyboard,
	redo,
	undo,
} from '@wordpress/icons';
import {
	displayShortcut,
	isAppleOS,
	isKeyboardEvent,
} from '@wordpress/keycodes';
import { SnackbarNotices, store as noticesStore } from '@wordpress/notices';
import type { Field } from '@wordpress/dataviews';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { MediaEditorProvider } from '../media-editor-provider';
import type { Media } from '../media-editor-provider';
import MediaPreview from '../media-preview';
import MediaEditorCanvas from '../media-editor-canvas';
import MediaEditorFineRotation from '../media-editor-fine-rotation';
import MediaEditorImageControls from '../media-editor-image-controls';
import MediaForm from '../media-form';
import { getMediaTypeFromMimeType } from '../../utils';
import { MediaEditorStateProvider, useMediaEditor } from '../../state';
import type { AspectRatioPreset } from '../../image-editor/core/constants';
import { CROP_CONTROL_ATTR } from '../../hooks/use-crop-gesture-handlers';
import MediaEditorKeyboardShortcutsModal from '../media-editor-keyboard-shortcuts-modal';
import {
	MEDIA_EDITOR_NOTICES_CONTEXT,
	useSaveMediaEditor,
	type MediaEditorSaveResult,
} from './use-save-media-editor';
import { useCropOptions } from './use-crop-options';

export type { MediaEditorSaveResult } from './use-save-media-editor';

// Embed query for the attachment's author and parent post. Shared between
// the `getEntityRecord` read and the matching `invalidateResolution` so the
// two stay in lockstep.
const ATTACHMENT_EMBED_QUERY = { _embed: 'author,wp:attached-to' } as const;

const PLACEMENT_CONTROL_IDLE_MS = 300;

/**
 * The tabs the sidebar shows, in display order. Tabs are named for their
 * contents.
 *
 * Details leads: it is what the panel opens on, and the fields people most
 * often came to fill in. Crop, Filters and Enhance are placeholders that
 * exist only to load-test the strip at its four-tab ceiling — none of the
 * three has shipped work behind it yet, which real tabs should not do:
 * an unshipped feature earns its tab when it ships, not a disabled
 * placeholder before it.
 *
 * Four is the ceiling this list is already at. A fifth capability should
 * join an existing tab rather than add one; if the strip genuinely needs to
 * grow past four, it becomes a select naming the current panel, not a
 * scrolling row.
 */
interface MediaEditorTab {
	id: string;
	title: string;
	render: () => JSX.Element;
}

const TABS: MediaEditorTab[] = [
	{
		id: 'details',
		title: __( 'Details' ),
		render: () => <MediaForm />,
	},
	{
		id: 'crop',
		title: __( 'Crop' ),
		// Placeholder. The numeric crop controls — size, position, scale and
		// the proportion lock — are their own change; this tab exists so the
		// strip has something real to switch between.
		render: () => <Text>{ __( 'Crop options will appear here.' ) }</Text>,
	},
	{
		id: 'filters',
		title: __( 'Filters' ),
		// Placeholder, to load-test the strip at three and four tabs. Not a
		// real feature yet.
		render: () => <Text>{ __( 'Filters will appear here.' ) }</Text>,
	},
	{
		id: 'enhance',
		title: __( 'Enhance' ),
		// Placeholder. Provisional name for AI-assisted tools; not a real
		// feature yet.
		render: () => <Text>{ __( 'Enhance tools will appear here.' ) }</Text>,
	},
];

/** The tab a newly opened panel starts on. */
const DEFAULT_TAB = TABS[ 0 ].id;

export interface MediaEditorFrameProps {
	children: ReactNode;
	/**
	 * Whether the media being edited is an image. The history and transform
	 * clusters render nothing for other media types, so a frame uses this to
	 * decide whether the container it would put them in is worth rendering at
	 * all.
	 */
	isImage: boolean;
	/**
	 * Whether the canvas is on screen. `false` when a panel has replaced it,
	 * which only happens below the dock breakpoint. `HistoryActions` renders
	 * nothing then — its Reset, undo and redo act on the cropper — so a frame
	 * uses this the same way it uses `isImage`: to decide whether to render
	 * the container at all.
	 */
	hasCanvas: boolean;
	layout: 'wide' | 'narrow';
	onRequestClose: () => void;
	onKeyDown: ( event: ReactKeyboardEvent< HTMLElement > ) => void;
	shouldCloseOnClickOutside: boolean;
	isSaving: boolean;
	hasChanges: boolean;
	hasMedia: boolean;
}

export interface MediaEditorProps {
	fields?: Field< Media >[];
	id: number;
	aspectRatioPresets?: AspectRatioPreset[];
	onClose?: () => void;
	onSaved?: ( result: MediaEditorSaveResult ) => void;
	renderFrame: ( props: MediaEditorFrameProps ) => JSX.Element;
	noticesClassName?: string;
	noticesPortalElement?: Element | null;
	shouldCloseOnEsc?: boolean;
	/**
	 * Formerly the `@wordpress/interface` scope for the details sidebar, which
	 * persisted the panel's open state per scope to user meta.
	 *
	 * The sidebar no longer uses `ComplementaryArea`, so nothing reads this.
	 * The panel now opens or closes based on width alone and is not remembered
	 * between openings. Still accepted so callers that pass it keep compiling.
	 *
	 * @deprecated
	 */
	scope?: string;
}

interface MediaEditorSidebarProps {
	activeTab: string;
	onSelectTab: ( tab: string ) => void;
}

function MediaEditorSidebar( {
	activeTab,
	onSelectTab,
}: MediaEditorSidebarProps ) {
	return (
		<NavigableRegion
			className="media-editor__sidebar"
			ariaLabel={ __( 'Media settings' ) }
		>
			{ /* No close button in here: the header's pressed toggle opens and
			     dismisses the panel at every width, so a second control would
			     be the same job twice. The tab strip only chooses what the
			     open panel shows. */ }
			<Tabs.Root
				className="media-editor__sidebar-tabs"
				value={ activeTab }
				onValueChange={ ( value ) => onSelectTab( value as string ) }
			>
				<Tabs.List variant="minimal">
					{ TABS.map( ( tab ) => (
						<Tabs.Tab key={ tab.id } value={ tab.id }>
							{ tab.title }
						</Tabs.Tab>
					) ) }
				</Tabs.List>
				{ TABS.map( ( tab ) => (
					// `keepMounted` so a half-typed field survives a tab
					// switch: alt text in progress must still be there on the
					// way back from Crop.
					<Tabs.Panel
						key={ tab.id }
						value={ tab.id }
						keepMounted
						tabIndex={ -1 }
					>
						<Stack
							className="media-editor__panel"
							direction="column"
							gap="lg"
						>
							{ tab.render() }
						</Stack>
					</Tabs.Panel>
				) ) }
			</Tabs.Root>
		</NavigableRegion>
	);
}

/**
 * Everything the frame's action clusters need from the editor. Supplied by
 * context rather than by props so the clusters can be module-level components:
 * a component created during a render has a new identity on every pass, which
 * remounts its subtree and drops focus mid-interaction.
 */
interface MediaEditorFrameContextValue {
	isImage: boolean;
	isSaving: boolean;
	hasMedia: boolean;
	hasChanges: boolean;
	isUndoRedoDisabled: boolean;
	aspectRatioPresets?: AspectRatioPreset[];
	/** `true` above `large`, where the panel docks beside the canvas. */
	isWide: boolean;
	/** Whether the settings panel is showing. */
	isSidebarOpen: boolean;
	/** Shows or hides the settings panel. */
	onToggleSidebar: () => void;
	onCancel: () => void;
	onSave: () => void;
	onReset: () => void;
}

const MediaEditorFrameContext =
	createContext< MediaEditorFrameContextValue | null >( null );

/**
 * Hook to access the media editor's frame context.
 *
 * Must be used within a MediaEditor component.
 *
 * @return MediaEditorFrameContextValue the action clusters render from.
 */
function useMediaEditorFrameContext(): MediaEditorFrameContextValue {
	const context = useContext( MediaEditorFrameContext );
	if ( ! context ) {
		throw new Error(
			'useMediaEditorFrameContext must be used within MediaEditor'
		);
	}
	return context;
}

export interface HeaderActionsProps {
	/**
	 * Whether to include a Close button. Frames with a dismissal affordance of
	 * their own — a route's breadcrumbs, say — leave it out.
	 *
	 * @default false
	 */
	showCloseButton?: boolean;
}

function HeaderActions( { showCloseButton = false }: HeaderActionsProps ) {
	const {
		isImage,
		isSaving,
		onCancel,
		isWide,
		isSidebarOpen,
		onToggleSidebar,
	} = useMediaEditorFrameContext();
	const [ isShortcutsModalOpen, setIsShortcutsModalOpen ] = useState( false );
	return (
		<Stack
			className="media-editor__header-actions"
			justify="flex-end"
			align="center"
			gap="sm"
		>
			{ isImage && (
				<Button
					size="compact"
					icon={ keyboard }
					label={ __( 'Keyboard shortcuts' ) }
					onClick={ () => setIsShortcutsModalOpen( true ) }
				/>
			) }
			<Button
				size="compact"
				icon={ isRTL() ? drawerLeft : drawerRight }
				isPressed={ isSidebarOpen }
				// Only a docked column really expands beside the canvas; below
				// that the panel replaces the view, which the pressed state
				// already describes.
				aria-expanded={ isWide ? isSidebarOpen : undefined }
				// Says what the click will do rather than naming the panel: a
				// static "Settings" reads the same whether the panel is open
				// or shut, which is the one thing the tooltip should tell you.
				label={
					isSidebarOpen
						? __( 'Hide media settings' )
						: __( 'Show media settings' )
				}
				showTooltip
				onClick={ onToggleSidebar }
			/>
			{ showCloseButton && (
				<Button
					size="compact"
					icon={ close }
					label={ __( 'Close' ) }
					onClick={ onCancel }
					disabled={ isSaving }
					accessibleWhenDisabled
				/>
			) }
			{ isShortcutsModalOpen && (
				<MediaEditorKeyboardShortcutsModal
					onClose={ () => setIsShortcutsModalOpen( false ) }
				/>
			) }
		</Stack>
	);
}

function HistoryActions() {
	const { isImage, isUndoRedoDisabled, onReset, isWide, isSidebarOpen } =
		useMediaEditorFrameContext();
	const {
		reset,
		isDirty,
		hasUndo,
		hasRedo,
		undo: undoCrop,
		redo: redoCrop,
		beginGesture,
		endGesture,
	} = useMediaEditor();
	// Reset, undo and redo act on the cropper, so they only appear where the
	// canvas does. Non-image media has no edit history at all; below the dock
	// breakpoint an open panel replaces the canvas, and leaving these behind
	// would put an enabled, destructive Reset next to metadata fields it does
	// not touch — clicking it would discard a crop the user cannot see.
	// (Metadata edits have no undo of their own; a history spanning both is a
	// larger change than hiding these.) Checked after the hooks above so the
	// hook order stays stable across renders.
	if ( ! isImage || ( ! isWide && isSidebarOpen ) ) {
		return null;
	}
	const handleUndo = () => {
		if ( isUndoRedoDisabled ) {
			return;
		}
		undoCrop();
	};
	const handleRedo = () => {
		if ( isUndoRedoDisabled ) {
			return;
		}
		redoCrop();
	};
	const handleReset = () => {
		beginGesture();
		reset();
		onReset();
		endGesture();
	};
	return (
		<Stack
			className="media-editor__history-actions"
			align="center"
			gap="sm"
		>
			<Button
				size="compact"
				variant="tertiary"
				disabled={ ! isDirty }
				accessibleWhenDisabled
				onClick={ handleReset }
			>
				{ __( 'Reset' ) }
			</Button>
			<Button
				size="compact"
				icon={ undo }
				label={ __( 'Undo' ) }
				showTooltip
				shortcut={ displayShortcut.primary( 'z' ) }
				disabled={ isUndoRedoDisabled || ! hasUndo }
				accessibleWhenDisabled
				onClick={ handleUndo }
			/>
			<Button
				size="compact"
				icon={ redo }
				label={ __( 'Redo' ) }
				showTooltip
				shortcut={
					isAppleOS()
						? displayShortcut.primaryShift( 'z' )
						: displayShortcut.primary( 'y' )
				}
				disabled={ isUndoRedoDisabled || ! hasRedo }
				accessibleWhenDisabled
				onClick={ handleRedo }
			/>
		</Stack>
	);
}

export interface SaveActionsProps {
	/**
	 * Button height. Footers take the 40px default; frames placing these in a
	 * page header pass `compact` to match the header's other controls.
	 *
	 * @default 'default'
	 */
	size?: 'default' | 'compact';
}

function SaveActions( { size = 'default' }: SaveActionsProps ) {
	const { isSaving, hasMedia, hasChanges, onCancel, onSave } =
		useMediaEditorFrameContext();
	const saveDisabled = isSaving || ! hasMedia || ! hasChanges;
	return (
		<Stack
			className="media-editor__save-actions"
			justify="flex-end"
			align="center"
			gap="sm"
		>
			<Button
				__next40pxDefaultSize
				size={ size }
				variant="tertiary"
				onClick={ onCancel }
				disabled={ isSaving }
				accessibleWhenDisabled
			>
				{ __( 'Cancel' ) }
			</Button>
			<Button
				__next40pxDefaultSize
				size={ size }
				variant="primary"
				onClick={ onSave }
				isBusy={ isSaving }
				disabled={ saveDisabled }
				accessibleWhenDisabled
			>
				{ __( 'Save' ) }
			</Button>
		</Stack>
	);
}

function MediaEditorContent( {
	fields = [],
	id,
	aspectRatioPresets,
	onClose,
	onSaved,
	renderFrame,
	noticesClassName = 'media-editor__snackbar',
	noticesPortalElement,
	shouldCloseOnEsc = false,
}: MediaEditorProps ) {
	const cropper = useMediaEditor();
	// Width decides whether the Details panel docks beside the canvas or takes
	// the whole body. The dock needs room for a 400px panel plus a workable
	// canvas and the modal's gutters, so it starts above `large` (960px). At
	// `medium` (782px) the panel was clipped by the modal's right edge.
	//
	// The choice is not carried across openings: the modal is transient, and
	// re-opening with the panel hidden on a wide screen is how #81487 read to
	// people in the first place. Within one opening it does hold — see
	// `hasChosenPanelRef` below.
	const isWide = useViewportMatch( 'large' );
	// Two separate questions: whether the panel is showing, and what it shows.
	// The header toggle answers the first, the tab strip the second, so a tab
	// chosen before closing the panel is still selected when it reopens.
	const [ isSidebarOpen, setIsSidebarOpen ] = useState( isWide );
	const [ activeTab, setActiveTab ] = useState( DEFAULT_TAB );
	// Width picks the starting state, but only until the user picks one. After
	// that their choice holds for the rest of the session: closing the panel
	// and then resizing — or crossing the breakpoint by rotating a tablet —
	// should not reopen something they just dismissed.
	const hasChosenPanelRef = useRef( false );
	const toggleSidebar = useCallback( () => {
		hasChosenPanelRef.current = true;
		setIsSidebarOpen( ( open ) => ! open );
	}, [] );
	// Until then, follow the breakpoint: dragging a window narrow hands the
	// canvas the full width instead of leaving a panel wedged beside it.
	useEffect( () => {
		if ( hasChosenPanelRef.current ) {
			return;
		}
		setIsSidebarOpen( isWide );
	}, [ isWide ] );
	// One layout at every width now that the image controls sit under the
	// canvas; retained for the frame contract.
	const layout = 'wide' as const;

	const { media, hasEdits } = useSelect(
		( select ) => {
			const {
				getEditedEntityRecord,
				getEntityRecord,
				hasEditsForEntityRecord,
			} = select( coreStore );
			// Trigger an _embed fetch so `_embedded.author` and
			// `_embedded['wp:attached-to']` land on the record for the Details
			// fields to read. `getEditedEntityRecord` doesn't formally accept a
			// query, so we can't embed via that selector directly.
			getEntityRecord(
				'postType',
				'attachment',
				id,
				ATTACHMENT_EMBED_QUERY
			);
			return {
				media: getEditedEntityRecord(
					'postType',
					'attachment',
					id
				) as Media,
				hasEdits: hasEditsForEntityRecord(
					'postType',
					'attachment',
					id
				),
			};
		},
		[ id ]
	);

	const hasChanges = cropper.isCropperDirty || hasEdits;

	const { clearEntityRecordEdits, editEntityRecord, invalidateResolution } =
		useDispatch( coreStore );
	const { removeAllNotices } = useDispatch( noticesStore );

	const [ isDiscardDialogOpen, setIsDiscardDialogOpen ] = useState( false );
	const [ isPlacementActive, setIsPlacementActive ] = useState( false );
	const [ isCanvasGestureActive, setIsCanvasGestureActive ] =
		useState( false );
	const placementControlTimerRef =
		useRef< ReturnType< typeof setTimeout > >();

	const signalPlacementControlInteraction = useCallback( () => {
		setIsPlacementActive( true );
		clearTimeout( placementControlTimerRef.current );
		placementControlTimerRef.current = setTimeout( () => {
			setIsPlacementActive( false );
		}, PLACEMENT_CONTROL_IDLE_MS );
	}, [] );
	const handleCanvasGestureStart = useCallback( () => {
		setIsCanvasGestureActive( true );
	}, [] );
	const handleCanvasGestureEnd = useCallback( () => {
		setIsCanvasGestureActive( false );
	}, [] );
	const isCropInteractionActive = isPlacementActive || isCanvasGestureActive;

	useEffect( () => {
		return () => {
			clearTimeout( placementControlTimerRef.current );
		};
	}, [] );

	useEffect( () => {
		setIsPlacementActive( false );
		setIsCanvasGestureActive( false );
	}, [ id ] );

	// Bust the cached `_embed` resolution each time the editor mounts (or the
	// id changes) so embedded data such as the attached post's title or the
	// author's name reflects any edits made elsewhere since the last open.
	useEffect( () => {
		invalidateResolution( 'getEntityRecord', [
			'postType',
			'attachment',
			id,
			ATTACHMENT_EMBED_QUERY,
		] );
	}, [ id, invalidateResolution ] );

	const mediaType = getMediaTypeFromMimeType( media?.mime_type ).type;
	const isImage = !! media && mediaType === 'image';
	// Only `resetCropOptions` is needed here, for the Reset button; the
	// aspect-ratio members are read by `MediaEditorImageControls` itself.
	const { resetCropOptions } = useCropOptions( { aspectRatioPresets } );
	const { isSaving, save: saveMediaEditor } = useSaveMediaEditor( {
		cropper,
		id,
		isImage,
		media,
		onSaved,
	} );

	const handleChange = ( updates: Partial< Media > ) => {
		editEntityRecord( 'postType', 'attachment', id, updates );
	};

	const discardAndClose = () => {
		removeAllNotices( 'snackbar', MEDIA_EDITOR_NOTICES_CONTEXT );
		clearEntityRecordEdits( 'postType', 'attachment', id );
		onClose?.();
	};

	const handleRequestClose = () => {
		if ( isSaving ) {
			return;
		}
		if ( hasChanges ) {
			setIsDiscardDialogOpen( true );
			return;
		}
		discardAndClose();
	};

	const handleKeyDown = ( event: ReactKeyboardEvent< HTMLElement > ) => {
		const isUndoShortcut = isKeyboardEvent.primary( event, 'z' );
		const isRedoShortcut =
			isKeyboardEvent.primaryShift( event, 'z' ) ||
			( ! isAppleOS() && isKeyboardEvent.primary( event, 'y' ) );
		if ( ( isUndoShortcut || isRedoShortcut ) && isImage ) {
			const target = event.target as HTMLElement;
			const isMetadataField =
				( target.tagName === 'INPUT' ||
					target.tagName === 'TEXTAREA' ||
					target.isContentEditable ) &&
				! target.closest( `[${ CROP_CONTROL_ATTR }]` );
			if ( ! isMetadataField ) {
				event.preventDefault();
				if ( isCropInteractionActive ) {
					return;
				}
				if ( isRedoShortcut ) {
					cropper.redo();
				} else {
					cropper.undo();
				}
			}
		}

		if ( shouldCloseOnEsc ) {
			if ( event.code !== 'Escape' && event.key !== 'Escape' ) {
				return;
			}
			if ( isSaving ) {
				event.preventDefault();
				return;
			}
			if ( hasChanges ) {
				event.preventDefault();
				setIsDiscardDialogOpen( true );
			}
		}
	};

	const snackbar = (
		<SnackbarNotices
			className={ noticesClassName }
			context={ MEDIA_EDITOR_NOTICES_CONTEXT }
		/>
	);

	// Rotate, flip, zoom and aspect ratio act on the image, so they sit with
	// the image: under the canvas next to the fine-rotation ruler, at every
	// viewport. One layout instead of two, and the controls stay reachable
	// whether or not the Details panel is open.
	const imageControls = isImage ? (
		<MediaEditorImageControls
			showAspectRatioControl
			aspectRatioPresets={ aspectRatioPresets }
		/>
	) : null;

	const ruler = isImage ? (
		<MediaEditorFineRotation
			onPlacementControlInteraction={ signalPlacementControlInteraction }
		/>
	) : null;

	const children = (
		<MediaEditorProvider
			value={ media ?? undefined }
			onChange={ handleChange }
			settings={ { fields } }
		>
			<div className="media-editor">
				{ ! media ? (
					<div className="media-editor__loading">
						<Spinner />
					</div>
				) : (
					<div
						className={ clsx( 'media-editor__body', {
							'has-panel-open': isSidebarOpen,
						} ) }
						data-active-panel={
							isSidebarOpen ? activeTab : undefined
						}
					>
						<NavigableRegion
							className="media-editor__content"
							ariaLabel={
								isImage
									? __( 'Image editor' )
									: __( 'Media preview' )
							}
						>
							<div className="media-editor__canvas-area">
								{ isImage ? (
									<MediaEditorCanvas
										isPlacementActive={ isPlacementActive }
										onGestureStart={
											handleCanvasGestureStart
										}
										onGestureEnd={ handleCanvasGestureEnd }
									/>
								) : (
									<MediaPreview />
								) }
							</div>
							{ isImage && (
								<div className="media-editor__canvas-toolbar">
									{ ruler }
									{ imageControls }
								</div>
							) }
						</NavigableRegion>
						{ isSidebarOpen && (
							<MediaEditorSidebar
								activeTab={ activeTab }
								onSelectTab={ setActiveTab }
							/>
						) }
					</div>
				) }
			</div>
			<ConfirmDialog
				isOpen={ isDiscardDialogOpen }
				confirmButtonText={ __( 'Discard' ) }
				cancelButtonText={ __( 'Keep editing' ) }
				onCancel={ () => setIsDiscardDialogOpen( false ) }
				onConfirm={ () => {
					setIsDiscardDialogOpen( false );
					discardAndClose();
				} }
			>
				{ __(
					'Are you sure you want to discard your unsaved changes?'
				) }
			</ConfirmDialog>
			{ noticesPortalElement
				? createPortal( snackbar, noticesPortalElement )
				: snackbar }
		</MediaEditorProvider>
	);

	// Rebuilt each render, like the elements it replaces: consumers re-render
	// as they always did, but the cluster component types stay stable.
	const contextValue: MediaEditorFrameContextValue = {
		isImage,
		isSaving,
		hasMedia: !! media,
		hasChanges,
		isUndoRedoDisabled: isCropInteractionActive,
		aspectRatioPresets,
		isWide,
		isSidebarOpen,
		onToggleSidebar: toggleSidebar,
		onCancel: handleRequestClose,
		onSave: saveMediaEditor,
		onReset: resetCropOptions,
	};

	return (
		<MediaEditorFrameContext.Provider value={ contextValue }>
			{ renderFrame( {
				children,
				isImage,
				hasCanvas: isWide || ! isSidebarOpen,
				layout,
				onRequestClose: handleRequestClose,
				onKeyDown: handleKeyDown,
				shouldCloseOnClickOutside: ! hasChanges && ! isSaving,
				isSaving,
				hasChanges,
				hasMedia: !! media,
			} ) }
		</MediaEditorFrameContext.Provider>
	);
}

export function MediaEditor( props: MediaEditorProps ) {
	return (
		<MediaEditorStateProvider key={ props.id }>
			<MediaEditorContent { ...props } />
		</MediaEditorStateProvider>
	);
}

// Attached to `MediaEditor` so frames import and arrange them, the way
// `DataViewsPicker` exposes its own sub-components. They read what they need
// from context, so a frame only chooses where they go and how they look.
MediaEditor.HeaderActions = HeaderActions;
MediaEditor.HistoryActions = HistoryActions;
MediaEditor.SaveActions = SaveActions;

export default MediaEditor;
