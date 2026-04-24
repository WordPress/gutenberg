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
import MediaForm from '../media-form';
import { store as mediaEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { getMediaTypeFromMimeType } from '../../utils';

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

	// Captured from the cropper via MediaEditorCanvas. Unused in this PR —
	// a follow-up will wire this to the Save button so save is enabled only
	// when the cropper has edits.
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [ isDirty, setIsDirty ] = useState( false );

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

	const tabs = useMemo< ModalTab[] >(
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

	const headerActions = (
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
				onClick={ handleCancel }
				disabled={ isSaving }
				accessibleWhenDisabled
			>
				{ __( 'Cancel' ) }
			</Button>
			<Button
				size="compact"
				variant="primary"
				onClick={ handleSave }
				isBusy={ isSaving }
				disabled={ isSaving || ! media }
				accessibleWhenDisabled
			>
				{ __( 'Save' ) }
			</Button>
		</Flex>
	);

	return (
		<Modal
			className="media-editor-modal"
			title={ __( 'Edit media' ) }
			size="fill"
			onRequestClose={ handleCancel }
			headerActions={ headerActions }
		>
			<MediaEditorProvider
				value={ media ?? undefined }
				onChange={ handleChange }
				settings={ { fields } }
			>
				<Tabs>
					<MediaEditorModalSidebar tabs={ tabs } />
				</Tabs>
				<InterfaceSkeleton
					className="media-editor-modal__skeleton"
					content={
						<div className="media-editor-modal__canvas">
							{ ! media && <Spinner /> }
							{ media &&
								getMediaTypeFromMimeType( media.mime_type )
									.type === 'image' && (
									<MediaEditorCanvas
										key={ media.id }
										onDirtyChange={ setIsDirty }
									/>
								) }
							{ media &&
								getMediaTypeFromMimeType( media.mime_type )
									.type !== 'image' && <MediaPreview /> }
						</div>
					}
					sidebar={ <ComplementaryArea.Slot scope="media-editor" /> }
				/>
			</MediaEditorProvider>
		</Modal>
	);
}

export default MediaEditorModal;
