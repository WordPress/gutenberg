/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';
import type { Field } from '@wordpress/dataviews';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';

/**
 * Internal dependencies
 */
import MediaEditor from '../media-editor';
import MediaBrowser from '../media-browser';
import type { Media } from '../media-editor-provider';
import { store as mediaEditorStore } from '../../store';
import type { MediaEditorModalUpdate } from '../../store/actions';
import type { AspectRatioPreset } from '../../image-editor/core/constants';

export interface MediaModalProps {
	/**
	 * Attachment fields to render in the Details tab (both edit and browse
	 * modes). Passed from the editor layer, which owns `usePostFields`,
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
 * Top-level singleton media modal. Routes between the browse picker and the
 * editor based on the current `mode` in `core/media-editor`. The editor mounts
 * exactly one instance at the editor root, gated by
 * `window.__experimentalUnifiedMediaModal`.
 * @param root0
 * @param root0.fields
 * @param root0.aspectRatioPresets
 */
export function MediaModal( {
	fields = [],
	aspectRatioPresets,
}: MediaModalProps ) {
	const { isModalOpen, mode } = useSelect( ( select ) => {
		const { isOpen, getMode } = select( mediaEditorStore );
		return {
			isModalOpen: isOpen(),
			mode: getMode(),
		};
	}, [] );

	if ( ! isModalOpen ) {
		return null;
	}

	if ( mode === 'browse' ) {
		return <MediaBrowser fields={ fields } />;
	}

	return (
		<EditModalContent
			fields={ fields }
			aspectRatioPresets={ aspectRatioPresets }
		/>
	);
}

function EditModalContent( { fields, aspectRatioPresets }: MediaModalProps ) {
	const { id, onUpdate, returnToBrowse } = useSelect( ( select ) => {
		const { getId, getOnUpdate, shouldReturnToBrowse } =
			select( mediaEditorStore );
		return {
			id: getId(),
			onUpdate: getOnUpdate(),
			returnToBrowse: shouldReturnToBrowse(),
		};
	}, [] );

	const { closeMediaEditorModal, exitEditMode } =
		useDispatch( mediaEditorStore );

	const handleClose = useCallback( () => {
		if ( returnToBrowse ) {
			exitEditMode();
		} else {
			closeMediaEditorModal();
		}
	}, [ returnToBrowse, exitEditMode, closeMediaEditorModal ] );

	const handleSaved = useCallback(
		( { id: savedId, url }: { id: number; url?: string } ) => {
			if ( savedId && onUpdate ) {
				const update: MediaEditorModalUpdate = {
					id: savedId,
					url,
				};
				onUpdate( update );
			}
			if ( returnToBrowse ) {
				exitEditMode();
			} else {
				closeMediaEditorModal();
			}
		},
		[ returnToBrowse, exitEditMode, closeMediaEditorModal, onUpdate ]
	);

	if ( ! id ) {
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
			onClose={ handleClose }
			onSaved={ handleSaved }
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
						title={
							returnToBrowse
								? __( 'Edit image' )
								: __( 'Edit media' )
						}
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

export default MediaModal;
