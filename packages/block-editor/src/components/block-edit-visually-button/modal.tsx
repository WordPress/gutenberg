import { Button, Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { getBlockContent } from '@wordpress/blocks';
import { store as blockEditorStore } from '../../store';
import { useNativeUndo } from '../../utils/native-undo';
import getBlockHTMLUpdate from '../block-list/get-block-html-update';
import type { TreeBlock } from '../../store/types';
import type { BlockHTMLModalProps } from './types';

export default function BlockHTMLModal( {
	clientId,
	onClose,
}: BlockHTMLModalProps ) {
	const block = useSelect(
		( select ) =>
			select( blockEditorStore ).getBlock( clientId ) as TreeBlock | null,
		[ clientId ]
	);
	const { updateBlock } = useDispatch( blockEditorStore );
	// The edits are local state until committed on update, so undo and redo
	// must remain the browser's own within the field.
	const nativeUndoRef = useNativeUndo();
	const [ html, setHtml ] = useState( () =>
		block ? getBlockContent( block ) : ''
	);

	const onUpdate = () => {
		const update = block && getBlockHTMLUpdate( block, html );

		if ( update ) {
			updateBlock( clientId, update );
		}

		onClose();
	};

	return (
		<Modal
			title={ __( 'Edit HTML' ) }
			onRequestClose={ onClose }
			overlayClassName="block-editor-block-html-modal"
			focusOnMount="firstContentElement"
			shouldCloseOnClickOutside={ false }
			size="large"
		>
			<Stack
				direction="column"
				gap="md"
				className="block-editor-block-html-modal__content"
			>
				<textarea
					ref={ nativeUndoRef }
					className="block-editor-block-html-modal__textarea"
					aria-label={ __( 'HTML' ) }
					value={ html }
					onChange={ ( event ) => setHtml( event.target.value ) }
				/>
				<Stack direction="row" justify="flex-end" gap="sm">
					<Button
						__next40pxDefaultSize
						variant="tertiary"
						onClick={ onClose }
					>
						{ __( 'Cancel' ) }
					</Button>
					<Button
						__next40pxDefaultSize
						variant="primary"
						onClick={ onUpdate }
					>
						{ __( 'Update' ) }
					</Button>
				</Stack>
			</Stack>
		</Modal>
	);
}
