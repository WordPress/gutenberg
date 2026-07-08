/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import { useEffect, useRef } from '@wordpress/element';
import { createSlotFill } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { Notes } from './notes';
import { NOTES_PANEL_WIDTH } from './constants';

export const { Slot: FloatingNotesSlot, Fill: FloatingNotesFill } =
	createSlotFill( Symbol( 'EditorFloatingNotes' ) );

/**
 * Reserves space at the right edge of the canvas so content never flows
 * under the floating notes panel. The space is created inside the canvas
 * document (padding on the `html` element), so it keeps the canvas
 * background color and leaves the canvas scrollbar at the window edge.
 *
 * @param {Object} overlayRef Ref to the floating notes overlay element.
 */
function useReservedCanvasSpace( overlayRef ) {
	useEffect( () => {
		const overlay = overlayRef.current;
		const editor = overlay?.closest( '.editor-visual-editor' );
		const iframe = editor?.querySelector( 'iframe[name="editor-canvas"]' );
		// The overlay is positioned at the inline end of the admin document;
		// reserve the canvas space on the same physical side.
		const paddingSide = isRTL() ? 'padding-left' : 'padding-right';

		let reserved;
		let clipped;
		let resizeObserver;

		// The canvas scrollbar stays at the window edge, but the reserved space
		// ends where the scrollbar begins. Inset the overlay by the scrollbar
		// width so the notes sit centered in the visible reserved space instead
		// of tucked against the scrollbar. (0 with overlay scrollbars.)
		const syncOverlayInset = () => {
			const view = iframe?.contentWindow;
			const scrollbarWidth = view
				? view.innerWidth -
				  iframe.contentDocument.documentElement.clientWidth
				: 0;
			overlay?.style.setProperty(
				'inset-inline-end',
				`${ scrollbarWidth }px`
			);
		};

		const reserveSpace = () => {
			// Fall back to the styles wrapper when the canvas is not iframed.
			reserved =
				iframe?.contentDocument?.documentElement ??
				editor?.querySelector( '.editor-styles-wrapper' );
			reserved?.style.setProperty(
				paddingSide,
				`${ NOTES_PANEL_WIDTH }px`
			);
			// Full-bleed content (e.g. `alignfull`) escapes root padding with
			// negative margins or viewport units, so it can still render
			// under the reserved space; clip it at the body edge instead.
			clipped = iframe?.contentDocument?.body;
			clipped?.style.setProperty( 'overflow-x', 'clip' );

			syncOverlayInset();

			// The scrollbar appears and disappears as the canvas content grows
			// and shrinks; keep the overlay aligned when it toggles.
			resizeObserver?.disconnect();
			if ( clipped && window.ResizeObserver ) {
				resizeObserver = new window.ResizeObserver( syncOverlayInset );
				resizeObserver.observe( clipped );
			}
		};

		reserveSpace();
		// The canvas document is replaced when the iframe reloads (e.g. on
		// device preview changes); reapply the reserved space when it does.
		iframe?.addEventListener( 'load', reserveSpace );

		return () => {
			iframe?.removeEventListener( 'load', reserveSpace );
			resizeObserver?.disconnect();
			reserved?.style.removeProperty( paddingSide );
			clipped?.style.removeProperty( 'overflow-x' );
			overlay?.style.removeProperty( 'inset-inline-end' );
		};
	}, [ overlayRef ] );
}

export function FloatingNotes( { notes, sidebarRef } ) {
	const overlayRef = useRef( null );
	useReservedCanvasSpace( overlayRef );

	return (
		<div
			ref={ overlayRef }
			role="region"
			aria-label={ __( 'Notes' ) }
			className="editor-collab-sidebar-overlay"
			style={ { width: NOTES_PANEL_WIDTH } }
		>
			<Notes notes={ notes } sidebarRef={ sidebarRef } isFloating />
		</div>
	);
}
