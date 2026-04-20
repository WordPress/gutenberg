/**
 * WordPress dependencies
 */
import {
	Button,
	Flex,
	Modal,
	Spinner,
	privateApis as componentsPrivateApis,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { __, isRTL } from '@wordpress/i18n';
import { drawerLeft, drawerRight } from '@wordpress/icons';
import { InterfaceSkeleton } from '@wordpress/interface';
import type { Field } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { MediaEditorProvider } from '../media-editor-provider';
import type { Media } from '../media-editor-provider';
import MediaPreview from '../media-preview';
import MediaForm from '../media-form';
import { store as mediaEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

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

export function MediaEditorModal( { fields = [] }: MediaEditorModalProps ) {
	const { isOpen, attachmentId, onUpdate } = useSelect( ( select ) => {
		const s = select( mediaEditorStore );
		return {
			isOpen: s.isMediaEditorModalOpen(),
			attachmentId: s.getMediaEditorModalAttachmentId(),
			onUpdate: s.getMediaEditorModalOnUpdate(),
		};
	}, [] );

	const media = useSelect(
		( select ) =>
			attachmentId
				? ( select( coreStore ).getEditedEntityRecord(
						'postType',
						'attachment',
						attachmentId
				  ) as Media )
				: null,
		[ attachmentId ]
	);

	const { editEntityRecord, saveEditedEntityRecord } =
		useDispatch( coreStore );
	const { closeMediaEditorModal } = useDispatch( mediaEditorStore );

	const [ isSidebarOpen, setIsSidebarOpen ] = useState( true );
	const [ isSaving, setIsSaving ] = useState( false );

	// Snapshot the original values for fields the modal edits, so Cancel can
	// restore them. Captured once per open.
	const originalFieldValuesRef = useRef< Record< string, unknown > | null >(
		null
	);
	useEffect( () => {
		if ( ! isOpen ) {
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
	}, [ isOpen, media, fields ] );

	const tabs = useMemo< ModalTab[] >(
		() => [
			{
				id: 'details',
				title: __( 'Details' ),
				panel: (
					<VStack className="media-editor-modal__panel" spacing={ 4 }>
						<MediaForm />
					</VStack>
				),
			},
		],
		[]
	);

	if ( ! isOpen || ! attachmentId ) {
		return null;
	}

	const handleChange = ( updates: Partial< Media > ) => {
		editEntityRecord( 'postType', 'attachment', attachmentId, updates );
	};

	const handleCancel = () => {
		if ( originalFieldValuesRef.current ) {
			editEntityRecord(
				'postType',
				'attachment',
				attachmentId,
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
				attachmentId
			) ) as Media | undefined;

			const next = ( saved ?? media ) as Media | null;
			if ( next && next.id && onUpdate ) {
				onUpdate( { ...next, id: next.id } );
			}
			closeMediaEditorModal();
		} finally {
			setIsSaving( false );
		}
	};

	const sidebarContent = (
		<Tabs>
			<Tabs.TabList>
				{ tabs.map( ( tab ) => (
					<Tabs.Tab key={ tab.id } tabId={ tab.id }>
						{ tab.title }
					</Tabs.Tab>
				) ) }
			</Tabs.TabList>
			{ tabs.map( ( tab ) => (
				<Tabs.TabPanel
					key={ tab.id }
					tabId={ tab.id }
					focusable={ false }
				>
					{ tab.panel }
				</Tabs.TabPanel>
			) ) }
		</Tabs>
	);

	const headerActions = (
		<Flex
			className="media-editor-modal__header-actions"
			justify="flex-end"
			expanded={ false }
			gap={ 2 }
		>
			<Button
				size="compact"
				icon={ isRTL() ? drawerLeft : drawerRight }
				label={
					isSidebarOpen ? __( 'Close panel' ) : __( 'Open panel' )
				}
				isPressed={ isSidebarOpen }
				onClick={ () => setIsSidebarOpen( ( open ) => ! open ) }
			/>
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
				<InterfaceSkeleton
					className="media-editor-modal__skeleton"
					content={
						<div className="media-editor-modal__canvas">
							{ media ? <MediaPreview /> : <Spinner /> }
						</div>
					}
					sidebar={
						isSidebarOpen ? (
							<div className="media-editor-modal__sidebar">
								{ sidebarContent }
							</div>
						) : null
					}
				/>
			</MediaEditorProvider>
		</Modal>
	);
}

export default MediaEditorModal;
