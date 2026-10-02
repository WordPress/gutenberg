import { Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';
import { store as noticesStore } from '@wordpress/notices';
import type { Field } from '@wordpress/dataviews';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import MediaEditor from '../media-editor';
import type { Media } from '../media-editor-provider';
import { store as mediaEditorStore } from '../../store';
import type { MediaEditorModalUpdate } from '../../store/actions';
import type { AspectRatioPreset } from '../../image-editor/core/constants';

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
	 * always provided by the media editor.
	 */
	aspectRatioPresets?: AspectRatioPreset[];
}

/**
 * The modal's footer chrome. The fine-rotation ruler and the image controls
 * both live under the canvas (in `media-editor__content`), never here, so the
 * footer has one layout at every width: History on the left, Cancel/Save on
 * the right.
 */
function ModalFooter() {
	return (
		<div
			className="media-editor-modal__footer"
			role="region"
			aria-label={ __( 'Editor actions' ) }
		>
			<MediaEditor.HistoryActions />
			<MediaEditor.SaveActions />
		</div>
	);
}

export function MediaEditorModal( {
	fields = [],
	aspectRatioPresets,
}: MediaEditorModalProps ) {
	const { isModalOpen, id, onUpdate, onClose } = useSelect( ( select ) => {
		const { isOpen, getId, getOnUpdate, getOnClose } =
			select( mediaEditorStore );
		return {
			isModalOpen: isOpen(),
			id: getId(),
			onUpdate: getOnUpdate(),
			onClose: getOnClose(),
		};
	}, [] );

	const { closeMediaEditorModal } = useDispatch( mediaEditorStore );
	const { createSuccessNotice } = useDispatch( noticesStore );

	if ( ! isModalOpen || ! id ) {
		return null;
	}

	const portalElement =
		typeof document === 'undefined' ? null : document.body;

	// React synthetic events bubble through the React tree, not the DOM tree,
	// so a host `ShortcutProvider` higher up still receives keydown events
	// from inside this portaled modal. Stop propagation at the modal boundary
	// so host shortcuts (undo/redo, save, etc.) don't fire from within.
	const stopKeyDownPropagation = (
		event: ReactKeyboardEvent< HTMLDivElement >
	) => {
		event.stopPropagation();
	};

	const handleClose = () => {
		closeMediaEditorModal();
		onClose?.();
	};

	return (
		<MediaEditor
			id={ id }
			fields={ fields }
			aspectRatioPresets={ aspectRatioPresets }
			shouldCloseOnEsc
			noticesClassName="media-editor-modal__snackbar"
			noticesPortalElement={ portalElement }
			onClose={ handleClose }
			onSaved={ ( { id: savedId, url, previous } ) => {
				if ( savedId && onUpdate ) {
					const update: MediaEditorModalUpdate = {
						id: savedId,
						url,
					};
					onUpdate( update );
				}
				handleClose();
				if ( previous && savedId !== previous.id && onUpdate ) {
					// Intentionally unscoped: the modal is closing, so the
					// snackbar surfaces in the host editor (not the media
					// editor's `MEDIA_EDITOR_NOTICES_CONTEXT` region).
					createSuccessNotice( __( 'Image edited.' ), {
						type: 'snackbar',
						actions: [
							{
								label: __( 'Undo' ),
								onClick: () => {
									onUpdate( {
										id: previous.id,
										url: previous.url,
									} );
								},
							},
						],
					} );
				}
			} }
			renderFrame={ ( {
				children,
				onRequestClose,
				onKeyDown,
				shouldCloseOnClickOutside,
			} ) => (
				<ShortcutProvider
					className="media-editor-modal__shortcut-scope"
					onKeyDown={ stopKeyDownPropagation }
				>
					<Modal
						className="media-editor-modal"
						title={ __( 'Edit media' ) }
						size="fill"
						isDismissible={ false }
						shouldCloseOnClickOutside={ shouldCloseOnClickOutside }
						onKeyDown={ onKeyDown }
						onRequestClose={ onRequestClose }
						headerActions={
							<MediaEditor.HeaderActions showCloseButton />
						}
					>
						{ children }
						<ModalFooter />
					</Modal>
				</ShortcutProvider>
			) }
		/>
	);
}

export default MediaEditorModal;
