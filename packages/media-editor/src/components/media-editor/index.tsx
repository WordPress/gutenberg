import clsx from 'clsx';
import {
	Button,
	Spinner,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { Stack, Tabs, VisuallyHidden } from '@wordpress/ui';
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
import { __ } from '@wordpress/i18n';
import { close, drawerRight, keyboard, redo, undo } from '@wordpress/icons';
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
import MediaEditorCropPanel from '../media-editor-crop-panel';
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
 * Identifier for the details panel, and the panel the sidebar opens on before
 * the user picks another. The sidebar tracks which panel is open rather than
 * whether one is, so a further panel is a new id here and a new entry in the
 * tab list — not a change to the state's shape.
 */
const DETAILS_PANEL = 'details';

/** Identifier for the crop panel. Images only; other media has nothing to crop. */
const CROP_PANEL = 'crop';

interface MediaEditorTab {
	id: string;
	title: string;
	render: () => JSX.Element;
}

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
	 * `narrow` below the `small` breakpoint, where the frame's header has no
	 * room for the history cluster beside its other controls. A frame uses
	 * this to place that cluster, not to decide whether it renders —
	 * `HistoryActions` returns nothing on its own when the canvas is off
	 * screen.
	 */
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
}

interface MediaEditorSidebarProps {
	tabs: MediaEditorTab[];
	/** The open panel's id. Always one of `tabs`. */
	activeTab: string;
	onSelectTab: ( tab: string ) => void;
}

function MediaEditorSidebar( {
	tabs,
	activeTab,
	onSelectTab,
}: MediaEditorSidebarProps ) {
	return (
		<NavigableRegion
			className="media-editor__sidebar"
			ariaLabel={ __( 'Media settings' ) }
		>
			{ /* No visible heading and no close button: the strip below names
			     the open panel and the header's pressed toggle dismisses it.
			     The heading stays for screen readers, which read neither as
			     this region's title. */ }
			<VisuallyHidden render={ <h2 /> }>
				{ __( 'Media settings' ) }
			</VisuallyHidden>
			<Tabs.Root
				className="media-editor__tabs"
				value={ activeTab }
				onValueChange={ onSelectTab }
			>
				{ /* `Tabs.List` sizes itself to its tabs (`width: fit-content`),
				     so the rule under the strip is drawn by this wrapper
				     instead, which spans the column. */ }
				<div className="media-editor__tablist">
					<Tabs.List variant="minimal">
						{ tabs.map( ( tab ) => (
							<Tabs.Tab key={ tab.id } value={ tab.id }>
								{ tab.title }
							</Tabs.Tab>
						) ) }
					</Tabs.List>
				</div>
				{ /* One `Tabs.Panel` per tab: the counts have to match or
				     `Tabs.Root` throws in dev. Only the active one paints
				     anything — the rest render nothing. */ }
				{ tabs.map( ( tab ) => (
					<Tabs.Panel
						key={ tab.id }
						value={ tab.id }
						tabIndex={ -1 }
						className="media-editor__panel"
					>
						<Stack direction="column" gap="lg">
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
	/** The open panel's id, or `null` when none is. */
	activePanel: string | null;
	/**
	 * Opens the sidebar on the last-shown panel, or closes it when one is
	 * already open.
	 */
	onTogglePanel: () => void;
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
	const { isImage, isSaving, onCancel, isWide, activePanel, onTogglePanel } =
		useMediaEditorFrameContext();
	const isPanelOpen = !! activePanel;
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
			{ /* The sidebar holds more than one panel, so this opens and
			     closes the sidebar rather than naming a panel: reopening
			     returns to whichever tab was last showing, and the tab strip
			     inside switches between them. */ }
			<Button
				size="compact"
				icon={ drawerRight }
				label={ __( 'Media settings' ) }
				isPressed={ isPanelOpen }
				// Only a docked column really expands beside the canvas; below
				// that the panel replaces the view, which the pressed state
				// already describes.
				aria-expanded={ isWide ? isPanelOpen : undefined }
				onClick={ onTogglePanel }
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
	const { isImage, isUndoRedoDisabled, onReset, isWide, activePanel } =
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
	if ( ! isImage || ( ! isWide && !! activePanel ) ) {
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
	// Width decides whether the settings panel docks beside the canvas or
	// takes the whole body. It docks from `small` (600px): the modal is the
	// viewport less a 16px margin either side, so a 320px panel and the
	// canvas column's 2 x 24px gutters still leave the canvas ~200px there
	// and ~380px by 782px. Tight, but a full-screen panel would have hidden
	// the image altogether — you could not crop and preview at once.
	//
	// The same line moves the transform controls: docked, the Crop panel
	// carries them; below it they fall back to a row under the canvas.
	//
	// The choice is not carried across openings: the modal is transient, and
	// re-opening with the panel hidden on a wide screen is how #81487 read to
	// people in the first place. Within one opening it does hold — see
	// `hasChosenPanelRef` below.
	const isWide = useViewportMatch( 'small' );
	// `null` when nothing is open, otherwise the open panel's id.
	const [ activePanel, setActivePanel ] = useState< string | null >(
		isWide ? DETAILS_PANEL : null
	);
	// Width picks the starting panel, but only until the user picks one. After
	// that their choice holds for the rest of the session: closing the panel
	// and then resizing — or crossing the breakpoint by rotating a tablet —
	// should not reopen something they just dismissed.
	const hasChosenPanelRef = useRef( false );
	// The panel the toggle reopens, and the one width picks until the user
	// picks their own. Tracked separately from `hasChosenPanelRef` because
	// the two answer different questions: whether the panel should be open,
	// and which tab it should show.
	const lastPanelRef = useRef( DETAILS_PANEL );
	const hasChosenTabRef = useRef( false );
	// Switching tabs says nothing about whether the panel should be open, so
	// it leaves `hasChosenPanelRef` alone: picking Details on a wide screen
	// and then dragging the window narrow should still hand the canvas the
	// full width.
	const selectPanel = useCallback( ( panel: string ) => {
		hasChosenTabRef.current = true;
		lastPanelRef.current = panel;
		setActivePanel( panel );
	}, [] );
	const togglePanel = useCallback( () => {
		hasChosenPanelRef.current = true;
		setActivePanel( ( open ) => ( open ? null : lastPanelRef.current ) );
	}, [] );
	// Below `small` a frame's header cannot fit the history cluster alongside
	// its own controls, so it moves that cluster elsewhere. The same width
	// undocks the panel, so this is `isWide` rather than a second query.
	const layout: 'wide' | 'narrow' = isWide ? 'wide' : 'narrow';
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

	// Until the user picks a panel, follow the breakpoint: dragging a window
	// narrow hands the canvas the full width instead of leaving a panel
	// wedged beside it.
	//
	// Docked, the panel opens on Crop: the canvas is still beside it and
	// cropping is what the editor is for. Below `small` an open panel covers
	// the canvas, and crop controls with no crop in sight are not worth
	// opening on, so Details leads there. Non-image media has no Crop tab at
	// all (see `tabs`), so it always gets Details. `isImage` comes from a
	// record that resolves after mount, which is why this runs in an effect
	// rather than seeding `useState`.
	useEffect( () => {
		if ( hasChosenPanelRef.current && hasChosenTabRef.current ) {
			return;
		}
		const defaultPanel = isWide && isImage ? CROP_PANEL : DETAILS_PANEL;
		if ( ! hasChosenTabRef.current ) {
			lastPanelRef.current = defaultPanel;
		}
		if ( ! hasChosenPanelRef.current ) {
			setActivePanel( isWide ? lastPanelRef.current : null );
		}
	}, [ isWide, isImage ] );
	// Only `resetCropOptions` is needed here, for the Reset button; the
	// aspect-ratio members are read by `MediaEditorImageControls` itself.
	const {
		aspectRatioValue,
		setAspectRatioValue,
		aspectRatioOptions,
		resetCropOptions,
	} = useCropOptions( { aspectRatioPresets } );
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

	// Below `small` the panel is full screen, so an open one replaces the
	// canvas and these never share the screen with the Crop panel's copies:
	// this row is what reaches rotate/flip/zoom while the panel is closed,
	// with aspect ratio joining them as a dropdown. From `small` up the Crop
	// panel docks beside the canvas and carries them instead.
	const imageControls =
		isImage && ! isWide ? (
			<MediaEditorImageControls
				showAspectRatioControl
				aspectRatioPresets={ aspectRatioPresets }
			/>
		) : null;

	// Crop leads, since it is what the docked panel opens on. Non-image media
	// has nothing to crop and gets Details alone, which is why the sidebar
	// takes this list rather than deriving it.
	const tabs: MediaEditorTab[] = [
		...( isImage
			? [
					{
						id: CROP_PANEL,
						title: __( 'Crop' ),
						render: () => (
							<MediaEditorCropPanel
								aspectRatioValue={ aspectRatioValue }
								onAspectRatioChange={ setAspectRatioValue }
								aspectRatioOptions={ aspectRatioOptions }
							/>
						),
					},
			  ]
			: [] ),
		{
			id: DETAILS_PANEL,
			title: __( 'Details' ),
			render: () => <MediaForm />,
		},
	];

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
							'has-panel-open': !! activePanel,
						} ) }
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
						{ !! activePanel && (
							<MediaEditorSidebar
								tabs={ tabs }
								// Swapping the edited media can drop the Crop
								// tab out from under an open panel — saving a
								// crop moves the editor to a new id, which may
								// resolve as non-image. Fall back rather than
								// hand `Tabs.Root` a value no tab matches.
								activeTab={
									tabs.some(
										( tab ) => tab.id === activePanel
									)
										? activePanel
										: DETAILS_PANEL
								}
								onSelectTab={ selectPanel }
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
		activePanel,
		onTogglePanel: togglePanel,
		onCancel: handleRequestClose,
		onSave: saveMediaEditor,
		onReset: resetCropOptions,
	};

	return (
		<MediaEditorFrameContext.Provider value={ contextValue }>
			{ renderFrame( {
				children,
				isImage,
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
