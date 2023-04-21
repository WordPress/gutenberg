/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { createSlotFill, Button } from '@wordpress/components';
import { ESCAPE } from '@wordpress/keycodes';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { closeSmall } from '@wordpress/icons';

const SLOT_FILL_NAME = 'EditSiteEditorCanvasContainerSlot';
const { Slot: EditorCanvasContainerSlot, Fill: EditorCanvasContainerFill } =
	createSlotFill( SLOT_FILL_NAME );

function EditorCanvasContainer( { onClose, title, children } ) {
	const [ isClosed, setIsClosed ] = useState( false );

	function closeOnEscape( event ) {
		if ( event.keyCode === ESCAPE && ! event.defaultPrevented ) {
			event.preventDefault();
			setIsClosed( true );
			onClose();
		}
	}

	if ( isClosed ) {
		return null;
	}

	return (
		/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
		<section
			className="editor-canvas-container"
			aria-label={ title }
			onKeyDown={ closeOnEscape }
		>
			<Button
				className="edit-site-edit-canvas__close-button"
				icon={ closeSmall }
				label={ __( 'Close' ) }
				onClick={ onClose }
				showTooltip={ false }
			/>
			<EditorCanvasContainerFill>{ children }</EditorCanvasContainerFill>
		</section>
	);
}

export default EditorCanvasContainer;
export { EditorCanvasContainerSlot };
