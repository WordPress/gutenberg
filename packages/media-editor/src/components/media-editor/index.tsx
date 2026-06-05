/**
 * WordPress dependencies
 */
import {
	Button,
	Flex,
	Spinner,
	__experimentalConfirmDialog as ConfirmDialog,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useViewportMatch } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
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
	// No type declarations available for @wordpress/interface.
	// @ts-expect-error
} from '@wordpress/interface';
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';

/**
 * Internal dependencies
 */
import { MediaEditorProvider } from '../media-editor-provider';
import type { Media } from '../media-editor-provider';
import MediaPreview from '../media-preview';
import MediaEditorCanvas from '../media-editor-canvas';
import MediaEditorFineRotation from '../media-editor-fine-rotation';
import MediaEditorImageControls from '../media-editor-image-controls';
import MediaEditorCropPanel from '../media-editor-crop-panel';
import MediaForm from '../media-form';
import { unlock } from '../../lock-unlock';
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

const { Tabs } = unlock( componentsPrivateApis );

interface EditorTab {
	id: string;
	title: string;
	panel: JSX.Element;
}

export interface MediaEditorFrameProps {
	children: ReactNode;
	headerActions: ReactNode;
	footerActions: ReactNode;
	/**
	 * Footer layout selector. Frames apply this to the footer container
	 * as a modifier class. Tracks the sidebar-collapse breakpoint (`medium`).
	 *
	 * - `wide`   — sidebar is a column; footer is a single row of History |
	 *              Cancel/Save (transform controls live in the Crop panel).
	 * - `narrow` — sidebar collapsed; transform controls sit above a
	 *              History | Cancel/Save row.
	 */
	footerLayout: 'wide' | 'narrow';
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
	showCloseButton?: boolean;
	shouldCloseOnEsc?: boolean;
}

function MediaEditorSidebar( { tabs }: { tabs: EditorTab[] } ) {
	const tabsContextValue = useContext( Tabs.Context );
	return (
		<ComplementaryArea
			scope="media-editor"
			identifier="media-editor/details"
			title={ __( 'Details' ) }
			icon={ drawerRight }
			isActiveByDefault
			className="media-editor__sidebar"
			panelClassName="media-editor__sidebar-panel"
			headerClassName="media-editor__sidebar-header"
			closeLabel={ __( 'Close media panel' ) }
			header={
				<Tabs.Context.Provider value={ tabsContextValue }>
					<Tabs.TabList>
						{ tabs.map( ( tab ) => (
							<Tabs.Tab key={ tab.id } tabId={ tab.id }>
								{ tab.title }
							</Tabs.Tab>
						) ) }
					</Tabs.TabList>
				</Tabs.Context.Provider>
			}
		>
			<Tabs.Context.Provider value={ tabsContextValue }>
				{ tabs.map( ( tab ) => (
					<Tabs.TabPanel
						key={ tab.id }
						tabId={ tab.id }
						focusable={ false }
					>
						{ tab.panel }
					</Tabs.TabPanel>
				) ) }
			</Tabs.Context.Provider>
		</ComplementaryArea>
	);
}

interface HeaderActionsProps {
	isSaving: boolean;
	isImage: boolean;
	showCloseButton?: boolean;
	onCancel: () => void;
}

function HeaderActions( {
	isSaving,
	isImage,
	showCloseButton = false,
	onCancel,
}: HeaderActionsProps ) {
	const [ isShortcutsModalOpen, setIsShortcutsModalOpen ] = useState( false );
	return (
		<Flex
			className="media-editor__header-actions"
			justify="flex-end"
			expanded={ false }
			gap={ 2 }
		>
			{ isImage && (
				<Button
					size="compact"
					icon={ keyboard }
					label={ __( 'Keyboard shortcuts' ) }
					onClick={ () => setIsShortcutsModalOpen( true ) }
				/>
			) }
			<PinnedItems.Slot scope="media-editor" />
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
		</Flex>
	);
}

interface HistoryActionsProps {
	isUndoRedoDisabled?: boolean;
	onReset: () => void;
}

function HistoryActions( {
	isUndoRedoDisabled = false,
	onReset,
}: HistoryActionsProps ) {
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
		<Flex
			className="media-editor__history-actions"
			expanded={ false }
			gap={ 2 }
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
		</Flex>
	);
}

interface FooterActionsProps {
	isSaving: boolean;
	hasMedia: boolean;
	hasChanges: boolean;
	onCancel: () => void;
	onSave: () => void;
}

function FooterActions( {
	isSaving,
	hasMedia,
	hasChanges,
	onCancel,
	onSave,
}: FooterActionsProps ) {
	const saveDisabled = isSaving || ! hasMedia || ! hasChanges;
	return (
		<Flex
			className="media-editor__footer-actions"
			justify="flex-end"
			expanded={ false }
			gap={ 2 }
		>
			<Button
				__next40pxDefaultSize
				variant="tertiary"
				onClick={ onCancel }
				disabled={ isSaving }
				accessibleWhenDisabled
			>
				{ __( 'Cancel' ) }
			</Button>
			<Button
				__next40pxDefaultSize
				variant="primary"
				onClick={ onSave }
				isBusy={ isSaving }
				disabled={ saveDisabled }
				accessibleWhenDisabled
			>
				{ __( 'Save' ) }
			</Button>
		</Flex>
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
	showCloseButton = false,
	shouldCloseOnEsc = false,
}: MediaEditorProps ) {
	const cropper = useMediaEditor();
	// The sidebar is a side column from the `small` breakpoint up and collapses
	// to an overlay below it — mirroring InterfaceSkeleton's behaviour, shifted
	// from `medium` to `small` (see the matching CSS overrides in style.scss).
	// Track that single breakpoint: in "panel mode" (≥ small) the
	// rotate/flip/zoom controls live in the Crop panel and the footer is just
	// History + Cancel/Save; below it the controls drop into the footer. (The
	// fine-rotation ruler always sits under the canvas.)
	const isPanelLayout = useViewportMatch( 'small' );
	const footerLayout: 'wide' | 'narrow' = isPanelLayout ? 'wide' : 'narrow';

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
						<Tabs>
							<MediaEditorSidebar tabs={ tabs } />
						</Tabs>
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
												focusOnMount
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
								<ComplementaryArea.Slot scope="media-editor" />
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

	const history = isImage ? (
		<HistoryActions
			isUndoRedoDisabled={ isCropInteractionActive }
			onReset={ resetCropOptions }
		/>
	) : null;
	const imageControls = isImage ? (
		<MediaEditorImageControls
			showAspectRatioControl
			aspectRatioPresets={ aspectRatioPresets }
		/>
	) : null;
	const actions = (
		<FooterActions
			isSaving={ isSaving }
			hasMedia={ !! media }
			hasChanges={ hasChanges }
			onCancel={ handleRequestClose }
			onSave={ saveMediaEditor }
		/>
	);

	// The fine-rotation ruler always lives under the canvas (in
	// `media-editor__content`), never the footer, so it stays constrained to
	// the canvas column at every viewport. One JSX tree per layout; DOM order
	// matches visual order.
	let footerActions: ReactNode;
	if ( footerLayout === 'wide' ) {
		// Sidebar is a column: image controls live in the Crop panel, so
		// the footer is just History + Cancel/Save.
		footerActions = (
			<>
				{ history }
				{ actions }
			</>
		);
	} else {
		// Sidebar collapsed: the image controls drop into the footer.
		footerActions = (
			<>
				{ imageControls }
				<div className="media-editor-modal__footer-row">
					{ history }
					{ actions }
				</div>
			</>
		);
	}

	return renderFrame( {
		children,
		headerActions: (
			<HeaderActions
				isSaving={ isSaving }
				isImage={ isImage }
				showCloseButton={ showCloseButton }
				onCancel={ handleRequestClose }
			/>
		),
		footerActions,
		footerLayout,
		onRequestClose: handleRequestClose,
		onKeyDown: handleKeyDown,
		shouldCloseOnClickOutside: ! hasChanges && ! isSaving,
		isSaving,
		hasChanges,
		hasMedia: !! media,
	} );
}

export function MediaEditor( props: MediaEditorProps ) {
	return (
		<MediaEditorStateProvider key={ props.id }>
			<MediaEditorContent { ...props } />
		</MediaEditorStateProvider>
	);
}

export default MediaEditor;
