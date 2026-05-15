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
import { close, drawerRight, keyboard } from '@wordpress/icons';
import { isAppleOS, isKeyboardEvent } from '@wordpress/keycodes';
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
import MediaEditorToolbar from '../media-editor-toolbar';
import MediaEditorCropPanel from '../media-editor-crop-panel';
import MediaForm from '../media-form';
import { unlock } from '../../lock-unlock';
import { getMediaTypeFromMimeType } from '../../utils';
import { CropperProvider, useCropper } from '../../image-editor';
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
	hasMedia: boolean;
	hasChanges: boolean;
	isImage: boolean;
	showCloseButton?: boolean;
	onCancel: () => void;
	onSave: () => void;
}

function HeaderActions( {
	isSaving,
	hasMedia,
	hasChanges,
	isImage,
	showCloseButton = false,
	onCancel,
	onSave,
}: HeaderActionsProps ) {
	const saveDisabled = isSaving || ! hasMedia || ! hasChanges;
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
			<Button
				size="compact"
				variant="tertiary"
				onClick={ onCancel }
				disabled={ isSaving }
				accessibleWhenDisabled
			>
				{ __( 'Cancel' ) }
			</Button>
			<Button
				size="compact"
				variant="primary"
				onClick={ onSave }
				isBusy={ isSaving }
				disabled={ saveDisabled }
				accessibleWhenDisabled
			>
				{ __( 'Save' ) }
			</Button>
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
	const cropper = useCropper();

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

	const hasChanges = cropper.isDirty || hasEdits;

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
		freeformCrop,
		setFreeformCrop,
		resolvedAspectRatio,
		resetCropOptions,
	} = useCropOptions( {
		id,
		isImage,
		media,
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
							freeformCrop={ freeformCrop }
							onFreeformChange={ setFreeformCrop }
							onPlacementControlInteraction={
								signalPlacementControlInteraction
							}
							aspectRatioOptions={ aspectRatioOptions }
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
		freeformCrop,
		setFreeformCrop,
		aspectRatioOptions,
		signalPlacementControlInteraction,
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
								footer: __( 'Image editing tools' ),
							} }
							content={
								<div className="media-editor__canvas">
									{ isImage ? (
										<MediaEditorCanvas
											aspectRatio={ resolvedAspectRatio }
											freeformCrop={ freeformCrop }
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
							}
							footer={
								isImage ? (
									<MediaEditorToolbar
										onReset={ resetCropOptions }
										onPlacementControlInteraction={
											signalPlacementControlInteraction
										}
										isUndoRedoDisabled={
											isCropInteractionActive
										}
									/>
								) : undefined
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

	return renderFrame( {
		children,
		headerActions: (
			<HeaderActions
				isSaving={ isSaving }
				hasMedia={ !! media }
				hasChanges={ hasChanges }
				isImage={ isImage }
				showCloseButton={ showCloseButton }
				onCancel={ handleRequestClose }
				onSave={ saveMediaEditor }
			/>
		),
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
		<CropperProvider key={ props.id }>
			<MediaEditorContent { ...props } />
		</CropperProvider>
	);
}

export default MediaEditor;
