/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';
import type { Field } from '@wordpress/dataviews';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

/**
 * Internal dependencies
 */
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

	const { closeMediaEditorModal } = useDispatch( mediaEditorStore );

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

	return (
		<MediaEditor
			id={ id }
			fields={ fields }
			aspectRatioPresets={ aspectRatioPresets }
			showCloseButton
			shouldCloseOnEsc
			noticesClassName="media-editor-modal__snackbar"
			noticesPortalElement={ portalElement }
			onClose={ closeMediaEditorModal }
			onSaved={ ( { id: savedId, url } ) => {
				if ( savedId && onUpdate ) {
					const update: MediaEditorModalUpdate = {
						id: savedId,
						url,
					};
					onUpdate( update );
				}
				closeMediaEditorModal();
			} }
			renderFrame={ ( {
				children,
				headerActions,
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
						headerActions={ headerActions }
					>
						{ children }
					</Modal>
				</ShortcutProvider>
			) }
		/>
	);
}

export default MediaEditorModal;
