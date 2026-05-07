/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import {
	Button,
	Flex,
	Modal,
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
import { store as mediaEditorStore } from '../../store';
import type { MediaEditorModalUpdate } from '../../store/actions';
import { unlock } from '../../lock-unlock';
import { getMediaTypeFromMimeType } from '../../utils';
import { CropperProvider, useCropper } from '../../image-editor';
import type { AspectRatioPreset } from '../../image-editor/core/constants';
import { CROP_CONTROL_ATTR } from '../../hooks/use-crop-gesture-handlers';
import { buildModifiers } from './build-modifiers';
import MediaEditorKeyboardShortcutsModal from '../media-editor-keyboard-shortcuts-modal';

// Details-tab edits the modal bundles into a transformed `/edit` request.
// Matches Core's `WP_REST_Attachments_Controller::get_edit_media_item_args`
// — that endpoint's arg schema explicitly whitelists only these fields
// (title / caption / description / alt_text / post), so forwarding any
// others would fail REST validation with `rest_invalid_param`. Staged
// edits to fields outside this list are not forwarded; a follow-up could
// persist them via a separate `saveEditedEntityRecord` call.
const METADATA_EDIT_KEYS = [
	'title',
	'caption',
	'description',
	'alt_text',
	'post',
] as const;

// Scope save-failure snackbars to this modal so they don't leak into the
// host editor's notices tray (and vice versa).
const NOTICES_CONTEXT = 'media-editor';
const PLACEMENT_CONTROL_IDLE_MS = 300;

const { Tabs } = unlock( componentsPrivateApis );

interface MediaEditorModalProps {
	/**
	 * Attachment fields to render in the Details tab.
	 *
	 * Passed from the editor layer (which owns the `usePostFields` hook),
	 * since `@wordpress/media-editor` cannot depend on `@wordpress/editor`.
	 */
	fields?: Field< Media >[];
	/**
	 * Fixed aspect-ratio presets for image cropping. Free and Original are
	 * always provided by the modal.
	 */
	aspectRatioPresets?: AspectRatioPreset[];
}

interface ModalTab {
	id: string;
	title: string;
	panel: JSX.Element;
}

// Renders the `ComplementaryArea` with a tab list in its header, mirroring
// the post editor's pattern in
// `packages/editor/src/components/sidebar/index.js`. The `header` prop
// replaces `ComplementaryArea`'s default `<h2>{ title }</h2>` row — `title`
// is still passed so it can label the pinned toolbar button. Tabs context
// must be re-provided on both sides of the Slot/Fill because the Fill
// doesn't preserve the Tabs React context across to the Slot.
function MediaEditorModalSidebar( { tabs }: { tabs: ModalTab[] } ) {
	const tabsContextValue = useContext( Tabs.Context );
	return (
		<ComplementaryArea
			scope="media-editor"
			identifier="media-editor/details"
			title={ __( 'Details' ) }
			icon={ drawerRight }
			isActiveByDefault
			className="media-editor-modal__sidebar"
			panelClassName="media-editor-modal__sidebar-panel"
			headerClassName="media-editor-modal__sidebar-header"
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
	onCancel: () => void;
	onSave: () => void;
}

function HeaderActions( {
	isSaving,
	hasMedia,
	hasChanges,
	onCancel,
	onSave,
}: HeaderActionsProps ) {
	const saveDisabled = isSaving || ! hasMedia || ! hasChanges;
	const [ isShortcutsModalOpen, setIsShortcutsModalOpen ] = useState( false );
	return (
		<Flex
			className="media-editor-modal__header-actions"
			justify="flex-end"
			expanded={ false }
			gap={ 2 }
		>
			<Button
				size="compact"
				icon={ keyboard }
				label={ __( 'Keyboard shortcuts' ) }
				onClick={ () => setIsShortcutsModalOpen( true ) }
			/>
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
			<Button
				size="compact"
				icon={ close }
				label={ __( 'Close' ) }
				onClick={ onCancel }
				disabled={ isSaving }
				accessibleWhenDisabled
			/>
			{ isShortcutsModalOpen && (
				<MediaEditorKeyboardShortcutsModal
					onClose={ () => setIsShortcutsModalOpen( false ) }
				/>
			) }
		</Flex>
	);
}

interface MediaEditorModalContentProps {
	fields: Field< Media >[];
	id: number;
	media: Media | null;
	hasEdits: boolean;
	aspectRatioPresets?: AspectRatioPreset[];
	onUpdate: ( ( updated: MediaEditorModalUpdate ) => void ) | null;
}

// Inner component rendered inside `CropperProvider` so it can read
// `isDirty` from the cropper. The outer `MediaEditorModal` keeps the
// store reads and provider tree above this.
function MediaEditorModalContent( {
	fields,
	id,
	media,
	hasEdits,
	aspectRatioPresets,
	onUpdate,
}: MediaEditorModalContentProps ) {
	const cropper = useCropper();
	const hasChanges = cropper.isDirty || hasEdits;

	const registry = useRegistry();
	const {
		clearEntityRecordEdits,
		editEntityRecord,
		receiveEntityRecords,
		saveEditedEntityRecord,
	} = useDispatch( coreStore );
	const { closeMediaEditorModal } = useDispatch( mediaEditorStore );
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

	// Reset aspect-ratio / freeform state when the media changes, so the
	// next image starts from the defaults.
	useEffect( () => {
		setAspectRatioValue( '0' );
		setFreeformCrop( true );
		setIsPlacementActive( false );
		setIsCanvasGestureActive( false );
	}, [ id ] );

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

	const tabs = useMemo< ModalTab[] >( () => {
		const detailsTab: ModalTab = {
			id: 'details',
			title: __( 'Details' ),
			panel: (
				<Stack
					className="media-editor-modal__panel"
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
						className="media-editor-modal__panel"
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
		closeMediaEditorModal();
	};

	const handleRequestClose = () => {
		// Disallow closing while a save is in flight so the in-progress
		// request can settle without the modal unmounting under it.
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
		// Clear any prior failure snackbar so a successful retry doesn't
		// leave a stale "Could not save image" hovering.
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
				// Bundle staged Details-tab edits into the same /edit
				// request. Transformed saves duplicate the attachment,
				// and the prior core-data edits were staged against the
				// old id — if we don't forward them here they'd be
				// silently lost. Core's `edit_media_item` honors these
				// keys via `prepare_item_for_database` and `alt_text`.
				const pendingEdits = registry
					.select( coreStore )
					.getEntityRecordNonTransientEdits(
						'postType',
						'attachment',
						id
					) as Record< string, unknown > | undefined;
				const metadataEdits: Record< string, unknown > = {};
				for ( const key of METADATA_EDIT_KEYS ) {
					if ( pendingEdits && key in pendingEdits ) {
						metadataEdits[ key ] = pendingEdits[ key ];
					}
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
					// Put the newly-created attachment into the core-data
					// cache so downstream consumers see it without an
					// extra fetch round-trip.
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

			// A transformed save creates a new attachment; clear staged
			// edits on the old record so it doesn't appear dirty in the
			// Media Library afterwards.
			if ( next && next.id !== id ) {
				clearEntityRecordEdits( 'postType', 'attachment', id );
			}

			if ( next && next.id && onUpdate ) {
				// Normalize to the public callback shape — see
				// `MediaEditorModalUpdate` in `../../store/actions.ts`.
				onUpdate( { id: next.id, url: next.source_url } );
			}
			closeMediaEditorModal();
		} catch ( error ) {
			const message =
				error instanceof Error
					? error.message
					: ( error as { message?: string } )?.message ??
					  __( 'An unknown error occurred.' );
			createErrorNotice(
				sprintf(
					/* translators: %s: Error message. */
					__( 'Could not save image. %s' ),
					message
				),
				{ type: 'snackbar', context: NOTICES_CONTEXT }
			);
		} finally {
			setIsSaving( false );
		}
	};

	return (
		<Modal
			className="media-editor-modal"
			title={ __( 'Edit media' ) }
			size="fill"
			isDismissible={ false }
			shouldCloseOnClickOutside={ ! hasChanges && ! isSaving }
			onKeyDown={ ( event ) => {
				// Undo / Redo — skip when a metadata text field is focused
				// so the browser's native field undo/redo (Details tab) is
				// preserved. Inputs inside a crop control wrapper are
				// intentionally included — the wrapper's data attribute
				// signals that custom undo/redo should handle them.
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
						return;
					}
				}

				if ( event.code !== 'Escape' && event.key !== 'Escape' ) {
					return;
				}
				// While saving, swallow ESC so the in-progress request
				// can settle without the modal closing under it.
				if ( isSaving ) {
					event.preventDefault();
					return;
				}
				// When there are pending changes, intercept ESC and
				// open the confirm dialog ourselves. `preventDefault`
				// short-circuits Modal's own ESC-to-close handler on
				// the overlay so the modal doesn't animate out before
				// the dialog appears.
				if ( hasChanges ) {
					event.preventDefault();
					setIsDiscardDialogOpen( true );
				}
			} }
			onRequestClose={ handleRequestClose }
			headerActions={
				<HeaderActions
					isSaving={ isSaving }
					hasMedia={ !! media }
					hasChanges={ hasChanges }
					onCancel={ handleRequestClose }
					onSave={ handleSave }
				/>
			}
		>
			<MediaEditorProvider
				value={ media ?? undefined }
				onChange={ handleChange }
				settings={ { fields } }
			>
				{ ! media ? (
					<div className="media-editor-modal__loading">
						<Spinner />
					</div>
				) : (
					<>
						<Tabs>
							<MediaEditorModalSidebar tabs={ tabs } />
						</Tabs>
						<InterfaceSkeleton
							className="media-editor-modal__skeleton"
							labels={ {
								body: isImage
									? __( 'Image editor' )
									: __( 'Media preview' ),
								sidebar: __( 'Media details' ),
								footer: __( 'Image editing tools' ),
							} }
							content={
								<div className="media-editor-modal__canvas">
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
				{ /* Rendered inside the parent Modal so it's tracked as
					 a nested dismisser. As a top-level sibling it would,
					 on mount, request the parent Modal close. */ }
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
			</MediaEditorProvider>
			{ createPortal(
				<SnackbarNotices
					className="media-editor-modal__snackbar"
					context={ NOTICES_CONTEXT }
				/>,
				document.body
			) }
		</Modal>
	);
}

export function MediaEditorModal( {
	fields = [],
	aspectRatioPresets,
}: MediaEditorModalProps ) {
	const { isModalOpen, id, onUpdate } = useSelect( ( select ) => {
		const { isOpen, getId, getOnUpdate } = select( mediaEditorStore );
		return {
			isModalOpen: isOpen(),
			id: getId(),
			onUpdate: getOnUpdate(),
		};
	}, [] );

	const { media, hasEdits } = useSelect(
		( select ) => {
			if ( ! id ) {
				return { media: null, hasEdits: false };
			}
			const { getEditedEntityRecord, hasEditsForEntityRecord } =
				select( coreStore );
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

	if ( ! isModalOpen || ! id ) {
		return null;
	}

	// `CropperProvider` is always mounted while the modal is open — it's
	// just a `useReducer` with no side effects — so the inner component
	// can read `isDirty` for images without forking on media type. The
	// `key` remounts the provider when the edited attachment changes,
	// discarding the previous cropper state. Keying on `id` (rather than
	// `media?.id`) avoids a remount when `media` resolves from `null` to
	// the loaded record on open — that flip would otherwise re-run the
	// modal's entry animation and cause a visible flicker.
	return (
		<CropperProvider key={ id }>
			<MediaEditorModalContent
				fields={ fields }
				id={ id }
				media={ media }
				hasEdits={ hasEdits }
				aspectRatioPresets={ aspectRatioPresets }
				onUpdate={ onUpdate }
			/>
		</CropperProvider>
	);
}

export default MediaEditorModal;
