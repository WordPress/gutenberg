/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useEffect, useRef, useState } from '@wordpress/element';
import { createSlotFill } from '@wordpress/components';
import { useStyleOverride } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { Notes } from './notes';
import {
	NOTES_PANEL_WIDTH,
	MIN_CANVAS_WIDTH_FOR_FLOATING_NOTES,
} from './constants';

export const { Slot: FloatingNotesSlot, Fill: FloatingNotesFill } =
	createSlotFill( Symbol( 'EditorFloatingNotes' ) );

// Reserves space at the inline end of the canvas so content never flows under
// the floating notes panel. The padding lives inside the canvas document, so
// it keeps the canvas background color and leaves the scrollbar at the window
// edge. `overflow-x: clip` on the body stops full-bleed content (e.g.
// `alignfull`, which escapes root padding with negative margins or viewport
// units) from rendering under the reserved space. Injected with
// `useStyleOverride` so it reaches the iframed canvas (and is scoped to
// `.editor-styles-wrapper` for non-iframed canvases); logical properties keep
// it on the correct physical side in RTL.
const RESERVED_SPACE_CSS = `:root{padding-inline-end:${ NOTES_PANEL_WIDTH }px}body{overflow-x:clip}`;

/**
 * Reserves space at the inline end of the canvas for the floating notes, and
 * reports whether the canvas is wide enough to host them.
 *
 * The editor canvas is freely resizable, so a wide viewport can still hold a
 * narrow canvas. Below `MIN_CANVAS_WIDTH_FOR_FLOATING_NOTES` the reserved space
 * would crowd out the content column, so the reservation is dropped and the
 * caller hides the panel (the "All notes" sidebar remains available).
 *
 * @param {Object} overlayRef Ref to the floating notes overlay element.
 * @return {boolean} Whether the canvas has room for the floating panel.
 */
function useReservedCanvasSpace( overlayRef ) {
	const [ hasRoom, setHasRoom ] = useState( true );

	// Only reserve the space while the canvas has room for it.
	useStyleOverride( {
		id: 'core-note-reserved-space',
		css: hasRoom ? RESERVED_SPACE_CSS : '',
	} );

	useEffect( () => {
		const overlay = overlayRef.current;
		if ( ! overlay ) {
			return;
		}
		const editor = overlay.closest( '.editor-visual-editor' );
		const iframe = editor?.querySelector( 'iframe[name="editor-canvas"]' );

		let resizeObserver;

		const sync = () => {
			const view = iframe?.contentWindow;
			const root = iframe?.contentDocument?.documentElement;
			// Canvas width is the iframe viewport minus its scrollbar; fall
			// back to the styles wrapper when the canvas is not iframed.
			const canvasWidth =
				root?.clientWidth ??
				editor?.querySelector( '.editor-styles-wrapper' )
					?.clientWidth ??
				Infinity;
			setHasRoom( canvasWidth >= MIN_CANVAS_WIDTH_FOR_FLOATING_NOTES );

			// The canvas scrollbar stays at the window edge, but the reserved
			// space ends where the scrollbar begins. Inset the overlay by the
			// scrollbar width so the notes sit centered in the visible reserved
			// space instead of tucked against the scrollbar. (0 with overlay
			// scrollbars.) Scrollbar width is a runtime measurement CSS can't
			// read.
			const scrollbarWidth =
				view && root ? view.innerWidth - root.clientWidth : 0;
			overlay.style.setProperty(
				'inset-inline-end',
				`${ scrollbarWidth }px`
			);
		};

		const observeCanvas = () => {
			sync();
			// The scrollbar appears and disappears as the canvas content grows
			// and shrinks, and the body reflows when the canvas is resized;
			// keep the measurements aligned when either happens.
			resizeObserver?.disconnect();
			const body = iframe?.contentDocument?.body;
			if ( body && window.ResizeObserver ) {
				resizeObserver = new window.ResizeObserver( sync );
				resizeObserver.observe( body );
			}
		};

		observeCanvas();
		// The canvas document is replaced when the iframe reloads (e.g. on
		// device preview changes); re-measure against the new document.
		iframe?.addEventListener( 'load', observeCanvas );

		return () => {
			iframe?.removeEventListener( 'load', observeCanvas );
			resizeObserver?.disconnect();
			overlay.style.removeProperty( 'inset-inline-end' );
		};
	}, [ overlayRef ] );

	return hasRoom;
}

export function FloatingNotes( { notes, sidebarRef } ) {
	const overlayRef = useRef( null );
	const hasRoom = useReservedCanvasSpace( overlayRef );

	return (
		<div
			ref={ overlayRef }
			role="region"
			aria-label={ __( 'Notes' ) }
			className="editor-collab-sidebar-overlay"
			// Keep the overlay mounted while the canvas is too narrow so its
			// observer keeps measuring, but hide it so the notes don't sit on
			// top of the content.
			style={ {
				width: NOTES_PANEL_WIDTH,
				display: hasRoom ? undefined : 'none',
			} }
		>
			<Notes notes={ notes } sidebarRef={ sidebarRef } isFloating />
		</div>
	);
}
