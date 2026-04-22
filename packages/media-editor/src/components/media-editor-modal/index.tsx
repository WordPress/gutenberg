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

const { Tabs } = unlock( componentsPrivateApis );

interface MediaEditorModalProps {
	/**
	 * Attachment fields to render in the Details tab.
	 *
	 * Passed from the editor layer (which owns the `usePostFields` hook),
	 * since `@wordpress/media-editor` cannot depend on `@wordpress/editor`.
	 */
	fields?: Field< Media >[];
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
	saveDisabled: boolean;
	onCancel: () => void;
	onSave: () => void;
}

function HeaderActions( {
	isSaving,
	saveDisabled,
	onCancel,
	onSave,
}: HeaderActionsProps ) {
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
				disabled={ isSaving || saveDisabled }
				accessibleWhenDisabled
			>
				{ __( 'Save' ) }
			</Button>
		</Flex>
	);
}

// Wrapper that reads `isDirty` from the cropper controller. Must live
// below `CropperProvider`. React context flows through the Modal's
// portal, so the `<Modal headerActions>` fill resolves inside the
// provider subtree.
function ImageHeaderActions(
	props: Omit< HeaderActionsProps, 'saveDisabled' >
) {
	const { isDirty } = useCropper();
	return <HeaderActions { ...props } saveDisabled={ ! isDirty } />;
}

// Body rendered for image media. Owns the aspect-ratio + freeform UI
// state (which drive the `<Cropper>` props but don't live on the cropper
// controller itself) and wires the bottom bar + Crop sidebar tab.
function ImageModalBody( { media }: { media: Media } ) {
	const [ aspectRatioValue, setAspectRatioValue ] = useState( '0' );
	const [ freeformCrop, setFreeformCrop ] = useState( true );

	const imageAspectRatio = useMemo( () => {
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
	}, [ media ] );

	const aspectRatio = resolveAspectRatio(
		aspectRatioValue,
		imageAspectRatio
	);

	const tabs = useMemo< ModalTab[] >(
		() => [
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
						/>
					</Stack>
				),
			},
			{
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
			},
		],
		[ aspectRatioValue, freeformCrop ]
	);

	return (
		<>
			<Tabs>
				<MediaEditorModalSidebar tabs={ tabs } />
			</Tabs>
			<InterfaceSkeleton
				className="media-editor-modal__skeleton"
				content={
					<div className="media-editor-modal__canvas">
						<MediaEditorCanvas
							aspectRatio={ aspectRatio }
							freeformCrop={ freeformCrop }
						/>
					</div>
				}
				footer={
					<MediaEditorToolbar
						onReset={ () => {
							setAspectRatioValue( '0' );
							setFreeformCrop( true );
						} }
					/>
				}
				sidebar={ <ComplementaryArea.Slot scope="media-editor" /> }
			/>
		</>
	);
}

export function MediaEditorModal( { fields = [] }: MediaEditorModalProps ) {
	const { isModalOpen, id, onUpdate } = useSelect( ( select ) => {
		const { isOpen, getId, getOnUpdate } = select( mediaEditorStore );
		return {
			isModalOpen: isOpen(),
			id: getId(),
			onUpdate: getOnUpdate(),
		};
	}, [] );

	const media = useSelect(
		( select ) =>
			id
				? ( select( coreStore ).getEditedEntityRecord(
						'postType',
						'attachment',
						id
				  ) as Media )
				: null,
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

	const detailsOnlyTabs = useMemo< ModalTab[] >(
		() => [
			{
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
			},
		],
		[]
	);

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

	const mediaType = getMediaTypeFromMimeType( media?.mime_type ).type;
	const isImage = !! media && mediaType === 'image';

	// `CropperProvider` wraps the whole Modal for image media so both the
	// body (canvas, bottom bar, sidebar Crop panel) and the header actions
	// (Save button, gated on `isDirty`) share one cropper controller.
	// React context flows through `<Modal>`'s portal.
	const content = (
		<Modal
			className="media-editor-modal"
			title={ __( 'Edit media' ) }
			size="fill"
			onRequestClose={ handleCancel }
			headerActions={
				isImage ? (
					<ImageHeaderActions
						isSaving={ isSaving }
						onCancel={ handleCancel }
						onSave={ handleSave }
					/>
				) : (
					<HeaderActions
						isSaving={ isSaving }
						saveDisabled={ ! media }
						onCancel={ handleCancel }
						onSave={ handleSave }
					/>
				)
			}
		>
			<MediaEditorProvider
				value={ media ?? undefined }
				onChange={ handleChange }
				settings={ { fields } }
			>
				{ ! media && <Spinner /> }
				{ media && isImage && <ImageModalBody media={ media } /> }
				{ media && ! isImage && (
					<>
						<Tabs>
							<MediaEditorModalSidebar tabs={ detailsOnlyTabs } />
						</Tabs>
						<InterfaceSkeleton
							className="media-editor-modal__skeleton"
							content={
								<div className="media-editor-modal__canvas">
									<MediaPreview />
								</div>
							}
							sidebar={
								<ComplementaryArea.Slot scope="media-editor" />
							}
						/>
					</>
				) }
			</MediaEditorProvider>
		</Modal>
	);

	if ( isImage ) {
		return <CropperProvider key={ media.id }>{ content }</CropperProvider>;
	}

	return content;
}

export default MediaEditorModal;
