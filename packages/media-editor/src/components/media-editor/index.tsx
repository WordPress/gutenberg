/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Flex,
	Spinner,
	__experimentalConfirmDialog as ConfirmDialog,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useDispatch, useRegistry, useSelect } from '@wordpress/data';
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
import { __, sprintf } from '@wordpress/i18n';
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
import MediaEditorCropPanel, {
	resolveAspectRatio,
} from '../media-editor-crop-panel';
import MediaForm from '../media-form';
import { unlock } from '../../lock-unlock';
import { getMediaTypeFromMimeType } from '../../utils';
import { CropperProvider, useCropper } from '../../image-editor';
import type { AspectRatioPreset } from '../../image-editor/core/constants';
import { CROP_CONTROL_ATTR } from '../../hooks/use-crop-gesture-handlers';
import { buildModifiers } from '../media-editor-modal/build-modifiers';
import MediaEditorKeyboardShortcutsModal from '../media-editor-keyboard-shortcuts-modal';

// Details-tab edits are bundled into transformed `/edit` requests. Core's
// endpoint only accepts this whitelist.
const METADATA_EDIT_KEYS = [
	'title',
	'caption',
	'description',
	'alt_text',
	'post',
] as const;

// Embed query for the attachment's author and parent post. Shared between
// the `getEntityRecord` read and the matching `invalidateResolution` so the
// two stay in lockstep.
const ATTACHMENT_EMBED_QUERY = { _embed: 'author,wp:attached-to' } as const;

// Scope save-failure snackbars so they don't leak into the host editor/page.
const NOTICES_CONTEXT = 'media-editor';
const PLACEMENT_CONTROL_IDLE_MS = 300;

const { Tabs } = unlock( componentsPrivateApis );

interface EditorTab {
	id: string;
	title: string;
	panel: JSX.Element;
}

export interface MediaEditorSaveResult {
	id: number;
	url?: string;
	media: Media;
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

type PendingMetadataEdits = Record< string, unknown > | undefined;

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

	const registry = useRegistry();
	const {
		clearEntityRecordEdits,
		editEntityRecord,
		invalidateResolution,
		receiveEntityRecords,
		saveEditedEntityRecord,
	} = useDispatch( coreStore );
	const { createErrorNotice, removeAllNotices } = useDispatch( noticesStore );

	const [ isSaving, setIsSaving ] = useState( false );
	const [ isDiscardDialogOpen, setIsDiscardDialogOpen ] = useState( false );
	const [ isPlacementActive, setIsPlacementActive ] = useState( false );
	const [ isCanvasGestureActive, setIsCanvasGestureActive ] =
		useState( false );
	const placementControlTimerRef =
		useRef< ReturnType< typeof setTimeout > >();

	const [ aspectRatioValue, setAspectRatioValue ] = useState( '0' );
	const [ freeformCrop, setFreeformCrop ] = useState( true );

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
		setAspectRatioValue( '0' );
		setFreeformCrop( true );
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

	const imageAspectRatio = useMemo( () => {
		if ( ! isImage ) {
			return null;
		}
		const naturalWidth = Number( media?.media_details?.width );
		const naturalHeight = Number( media?.media_details?.height );
		if (
			Number.isFinite( naturalWidth ) &&
			Number.isFinite( naturalHeight ) &&
			naturalHeight > 0
		) {
			return naturalWidth / naturalHeight;
		}
		return null;
	}, [ isImage, media ] );

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
							aspectRatioPresets={ aspectRatioPresets }
						/>
					</Stack>
				),
			},
			detailsTab,
		];
	}, [
		isImage,
		aspectRatioValue,
		freeformCrop,
		aspectRatioPresets,
		signalPlacementControlInteraction,
	] );

	const handleChange = ( updates: Partial< Media > ) => {
		editEntityRecord( 'postType', 'attachment', id, updates );
	};

	const discardAndClose = () => {
		removeAllNotices( 'snackbar', NOTICES_CONTEXT );
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

	const handleSave = async () => {
		removeAllNotices( 'snackbar', NOTICES_CONTEXT );
		setIsSaving( true );
		try {
			let saved: Media | null | undefined;

			const modifiers =
				cropper.isDirty && cropper.state.image
					? buildModifiers( cropper.state, {
							width: cropper.state.image.naturalWidth,
							height: cropper.state.image.naturalHeight,
					  } )
					: [];

			if ( modifiers.length > 0 ) {
				const pendingEdits = registry
					.select( coreStore )
					.getEntityRecordNonTransientEdits(
						'postType',
						'attachment',
						id
					) as PendingMetadataEdits;
				const metadataEdits: Record< string, unknown > = {};
				for ( const key of METADATA_EDIT_KEYS ) {
					if ( pendingEdits && key in pendingEdits ) {
						metadataEdits[ key ] = pendingEdits[ key ];
					}
				}
				// The `/edit` endpoint creates a new attachment for the crop
				// and doesn't inherit `post_parent` from the source (unlike
				// title/caption/etc.), so carry the existing value across when
				// the user hasn't explicitly edited it. Use a defined-check so
				// an explicit `0` (unattached) is also preserved.
				if (
					! ( 'post' in metadataEdits ) &&
					media?.post !== undefined
				) {
					metadataEdits.post = media.post;
				}

				saved = ( await apiFetch( {
					path: `/wp/v2/media/${ id }/edit`,
					method: 'POST',
					data: {
						src: media?.source_url,
						modifiers,
						...metadataEdits,
					},
				} ) ) as Media;

				if ( saved ) {
					receiveEntityRecords(
						'postType',
						'attachment',
						saved,
						undefined,
						true
					);
				}
			} else {
				saved = ( await saveEditedEntityRecord(
					'postType',
					'attachment',
					id
				) ) as Media | undefined;
			}

			const next = ( saved ?? media ) as Media | null;

			if ( next && next.id !== id ) {
				clearEntityRecordEdits( 'postType', 'attachment', id );
			}

			if ( next && next.id ) {
				if ( next.id === id ) {
					cropper.reset();
				}
				onSaved?.( {
					id: next.id,
					url: next.source_url,
					media: next,
				} );
			}
		} catch ( error ) {
			const message =
				error instanceof Error
					? error.message
					: ( error as { message?: string } )?.message ??
					  __( 'An unknown error occurred.' );
			createErrorNotice(
				isImage
					? sprintf(
							/* translators: %s: Error message. */
							__( 'Could not save image. %s' ),
							message
					  )
					: sprintf(
							/* translators: %s: Error message. */
							__( 'Could not save media. %s' ),
							message
					  ),
				{ type: 'snackbar', context: NOTICES_CONTEXT }
			);
		} finally {
			setIsSaving( false );
		}
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
			context={ NOTICES_CONTEXT }
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
											aspectRatio={ resolveAspectRatio(
												aspectRatioValue,
												imageAspectRatio
											) }
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
										onReset={ () => {
											setAspectRatioValue( '0' );
											setFreeformCrop( true );
										} }
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
				onSave={ handleSave }
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
