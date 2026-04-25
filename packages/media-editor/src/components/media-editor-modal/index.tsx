/**
 * WordPress dependencies
 */
import {
	Button,
	Flex,
	Modal,
	Spinner,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import {
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { drawerRight } from '@wordpress/icons';
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
import { unlock } from '../../lock-unlock';
import { getMediaTypeFromMimeType } from '../../utils';
import { CropperProvider, useCropper } from '../../image-editor';
import type { AspectRatioPreset } from '../../image-editor/core/constants';

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
	hasEdits: boolean;
	onCancel: () => void;
	onSave: () => void;
}

function HeaderActions( {
	isSaving,
	hasMedia,
	hasEdits,
	onCancel,
	onSave,
}: HeaderActionsProps ) {
	const { isDirty } = useCropper();
	const saveDisabled = isSaving || ! hasMedia || ( ! isDirty && ! hasEdits );
	return (
		<Flex
			className="media-editor-modal__header-actions"
			justify="flex-end"
			expanded={ false }
			gap={ 2 }
		>
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
		</Flex>
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

	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );
	const { closeMediaEditorModal } = useDispatch( mediaEditorStore );

	const [ isSaving, setIsSaving ] = useState( false );

	// Snapshot the original values for fields the modal edits, so Cancel can
	// restore them. Captured once per open.
	const originalFieldValuesRef = useRef< Record< string, unknown > | null >(
		null
	);
	useEffect( () => {
		if ( ! isModalOpen ) {
			originalFieldValuesRef.current = null;
			return;
		}
		if ( ! originalFieldValuesRef.current && media ) {
			const snapshot: Record< string, unknown > = {};
			fields.forEach( ( field ) => {
				snapshot[ field.id ] = ( media as Record< string, unknown > )[
					field.id
				];
			} );
			originalFieldValuesRef.current = snapshot;
		}
	}, [ isModalOpen, media, fields ] );

	const [ aspectRatioValue, setAspectRatioValue ] = useState( '0' );
	const [ freeformCrop, setFreeformCrop ] = useState( true );

	// Reset aspect-ratio / freeform state when the media changes, so the
	// next image starts from the defaults.
	useEffect( () => {
		setAspectRatioValue( '0' );
		setFreeformCrop( true );
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
							aspectRatioPresets={ aspectRatioPresets }
						/>
					</Stack>
				),
			},
			detailsTab,
		];
	}, [ isImage, aspectRatioValue, freeformCrop, aspectRatioPresets ] );

	if ( ! isModalOpen || ! id ) {
		return null;
	}

	const handleChange = ( updates: Partial< Media > ) => {
		editEntityRecord( 'postType', 'attachment', id, updates );
	};

	const handleCancel = () => {
		if ( originalFieldValuesRef.current ) {
			editEntityRecord(
				'postType',
				'attachment',
				id,
				originalFieldValuesRef.current
			);
		}
		closeMediaEditorModal();
	};

	const handleSave = async () => {
		setIsSaving( true );
		try {
			const saved = ( await saveEditedEntityRecord(
				'postType',
				'attachment',
				id
			) ) as Media | undefined;

			const next = ( saved ?? media ) as Media | null;
			if ( next && next.id && onUpdate ) {
				// Normalize to the public callback shape — see
				// `MediaEditorModalUpdate` in `../../store/actions.ts`.
				onUpdate( { id: next.id, url: next.source_url } );
			}
			closeMediaEditorModal();
		} finally {
			setIsSaving( false );
		}
	};

	// `CropperProvider` is always mounted — it's just a `useReducer` with
	// no side effects — so the header actions can read `isDirty` for
	// images without the JSX forking on media type. React context flows
	// through `<Modal>`'s portal to the `headerActions` slot.
	//
	// The `key` remounts the provider when the edited attachment changes,
	// discarding the previous cropper state. Today the modal always
	// closes between edits so this is belt-and-braces, but it guards
	// against future flows that swap `id` in the store without closing.
	return (
		<CropperProvider key={ media?.id ?? 'none' }>
			<Modal
				className="media-editor-modal"
				title={ __( 'Edit media' ) }
				size="fill"
				onRequestClose={ handleCancel }
				headerActions={
					<HeaderActions
						isSaving={ isSaving }
						hasMedia={ !! media }
						hasEdits={ hasEdits }
						onCancel={ handleCancel }
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
						<Spinner />
					) : (
						<>
							<Tabs>
								<MediaEditorModalSidebar tabs={ tabs } />
							</Tabs>
							<InterfaceSkeleton
								className="media-editor-modal__skeleton"
								content={
									<div className="media-editor-modal__canvas">
										{ isImage ? (
											<MediaEditorCanvas
												aspectRatio={ resolveAspectRatio(
													aspectRatioValue,
													imageAspectRatio
												) }
												freeformCrop={ freeformCrop }
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
										/>
									) : undefined
								}
								sidebar={
									<ComplementaryArea.Slot scope="media-editor" />
								}
							/>
						</>
					) }
				</MediaEditorProvider>
			</Modal>
		</CropperProvider>
	);
}

export default MediaEditorModal;
