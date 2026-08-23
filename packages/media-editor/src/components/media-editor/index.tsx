import {
	Button,
	Spinner,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { Stack, Tabs } from '@wordpress/ui';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	createContext,
	createPortal,
	useCallback,
	useContext,
	useEffect,
	useMemo,
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
import {
	ComplementaryArea,
	InterfaceSkeleton,
	PinnedItems,
	// @ts-expect-error `@wordpress/interface` is not typed yet.
} from '@wordpress/interface';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import { MediaEditorProvider } from '../media-editor-provider';
import type { Media } from '../media-editor-provider';
import MediaPreview from '../media-preview';
import MediaEditorCanvas from '../media-editor-canvas';
import MediaEditorFineRotation from '../media-editor-fine-rotation';
import MediaEditorImageControls from '../media-editor-image-controls';
import MediaEditorCropPanel from '../media-editor-crop-panel';
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

interface EditorTab {
	id: string;
	title: string;
	panel: JSX.Element;
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
	 * The `@wordpress/interface` scope for the details sidebar and its pinned
	 * items. Frames should pass a distinct scope so that sidebar visibility —
	 * which is persisted per scope to user meta — is remembered separately for
	 * each surface. The modal is a transient surface where a collapsed sidebar
	 * is a reasonable choice; the full-screen route is one where the sidebar is
	 * the primary metadata surface and should open by default. Sharing a scope
	 * would let a choice made in one decide the other's starting state.
	 *
	 * @default 'media-editor'
	 */
	scope?: string;
}

interface MediaEditorSidebarProps {
	tabs: EditorTab[];
	activeTabId?: string;
	onTabChange: ( tabId: string ) => void;
	scope: string;
}

function MediaEditorSidebar( {
	tabs,
	activeTabId,
	onTabChange,
	scope,
}: MediaEditorSidebarProps ) {
	return (
		<ComplementaryArea
			scope={ scope }
			identifier="media-editor/details"
			title={ __( 'Details' ) }
			icon={ drawerRight }
			isActiveByDefault
			className="media-editor__sidebar"
			panelClassName="media-editor__sidebar-panel"
			headerClassName="media-editor__sidebar-header"
			closeLabel={ __( 'Close media panel' ) }
			// Makes `Tabs.Root` the container, so the tab list passed as
			// `header` and the panels below share a subtree across the fill.
			render={
				<Tabs.Root
					value={ activeTabId }
					onValueChange={ ( value ) =>
						onTabChange( value as string )
					}
				/>
			}
			header={
				<Tabs.List variant="minimal">
					{ tabs.map( ( tab ) => (
						<Tabs.Tab key={ tab.id } value={ tab.id }>
							{ tab.title }
						</Tabs.Tab>
					) ) }
				</Tabs.List>
			}
		>
			{ tabs.map( ( tab ) => (
				<Tabs.Panel key={ tab.id } value={ tab.id } tabIndex={ -1 }>
					{ tab.panel }
				</Tabs.Panel>
			) ) }
		</ComplementaryArea>
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
	scope: string;
	aspectRatioPresets?: AspectRatioPreset[];
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
	const { isImage, isSaving, onCancel, scope } = useMediaEditorFrameContext();
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
			<PinnedItems.Slot scope={ scope } />
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
	const { isImage, isUndoRedoDisabled, onReset } =
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
	// Non-image media has no edit history. Checked after the hooks above so
	// the hook order stays stable across renders.
	if ( ! isImage ) {
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

function ImageControls() {
	const { isImage, aspectRatioPresets } = useMediaEditorFrameContext();
	// Non-image media has nothing to transform. Placement is the frame's call:
	// render this only in the `narrow` layout, since above that breakpoint the
	// Crop panel holds these controls already.
	if ( ! isImage ) {
		return null;
	}
	return (
		<MediaEditorImageControls
			showAspectRatioControl
			aspectRatioPresets={ aspectRatioPresets }
		/>
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
	scope = 'media-editor',
}: MediaEditorProps ) {
	const cropper = useMediaEditor();
	// The sidebar is a side column from the `small` breakpoint up and collapses
	// to an overlay below it — mirroring InterfaceSkeleton's behaviour, shifted
	// from `medium` to `small` (see the matching CSS overrides in style.scss).
	// Track that single breakpoint: in "panel mode" (≥ small) the
	// rotate/flip/zoom controls live in the Crop panel; below it they have no
	// panel to live in and the frame places them instead. (The fine-rotation
	// ruler always sits under the canvas.)
	const isPanelLayout = useViewportMatch( 'small' );
	const layout: 'wide' | 'narrow' = isPanelLayout ? 'wide' : 'narrow';

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
	const {
		aspectRatioValue,
		setAspectRatioValue,
		aspectRatioOptions,
		resetCropOptions,
	} = useCropOptions( {
		aspectRatioPresets,
	} );
	const { isSaving, save: saveMediaEditor } = useSaveMediaEditor( {
		cropper,
		id,
		isImage,
		media,
		onSaved,
	} );

	const tabs = useMemo< EditorTab[] >( () => {
		const detailsTab: EditorTab = {
			id: 'details',
			title: __( 'Details' ),
			panel: (
				<Stack
					className="media-editor__panel"
					direction="column"
					gap="lg"
				>
					<MediaForm />
				</Stack>
			),
		};
		if ( ! isImage ) {
			return [ detailsTab ];
		}
		return [
			{
				id: 'crop',
				title: __( 'Crop' ),
				panel: (
					<Stack
						className="media-editor__panel"
						direction="column"
						gap="lg"
					>
						<MediaEditorCropPanel
							aspectRatioValue={ aspectRatioValue }
							onAspectRatioChange={ setAspectRatioValue }
							aspectRatioOptions={ aspectRatioOptions }
							showTransformControls={ isPanelLayout }
						/>
					</Stack>
				),
			},
			detailsTab,
		];
	}, [
		isImage,
		aspectRatioValue,
		setAspectRatioValue,
		aspectRatioOptions,
		isPanelLayout,
	] );

	// Control the active tab from state here so the selection survives the
	// sidebar closing (which unmounts the `ComplementaryArea` Fill and its
	// tabs). Fall back to the first tab until one is picked, so images open on
	// Crop.
	const [ selectedTabId, setSelectedTabId ] = useState< string >();
	const activeTabId = selectedTabId ?? tabs[ 0 ]?.id;

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
					<>
						<MediaEditorSidebar
							tabs={ tabs }
							activeTabId={ activeTabId }
							onTabChange={ setSelectedTabId }
							scope={ scope }
						/>
						<InterfaceSkeleton
							className="media-editor__skeleton"
							labels={ {
								body: isImage
									? __( 'Image editor' )
									: __( 'Media preview' ),
								sidebar: __( 'Media details' ),
							} }
							content={
								<div className="media-editor__content">
									<div className="media-editor__canvas-area">
										{ isImage ? (
											<MediaEditorCanvas
												isPlacementActive={
													isPlacementActive
												}
												onGestureStart={
													handleCanvasGestureStart
												}
												onGestureEnd={
													handleCanvasGestureEnd
												}
											/>
										) : (
											<MediaPreview />
										) }
									</div>
									{ isImage && (
										<div className="media-editor__canvas-toolbar">
											{ ruler }
										</div>
									) }
								</div>
							}
							sidebar={
								<ComplementaryArea.Slot scope={ scope } />
							}
						/>
					</>
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
		scope,
		aspectRatioPresets,
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
MediaEditor.ImageControls = ImageControls;

export default MediaEditor;
