interface ScrollToCursorOptions {
	behavior?: ScrollBehavior;
	block?: ScrollLogicalPosition;
	inline?: ScrollLogicalPosition;
	highlightDuration?: number;
}

/**
 * Cursor Registry
 * ===
 * This registry stores references to cursor elements so that we can access them
 * in different parts of the component tree. This would more ideally be solved
 * with React context or state in the awareness store, but:
 *
 * 1. EditorPresence and BlockCanvasCover slot/fill break context propagation. We
 *    don't currently have a way to provide context to both the slot and fill.
 * 2. Storing pointers to the cursor elements in the awareness store might be a
 *    better solution, but would require broader refactoring.
 *
 * For now, we create a single instance of this registry and pass it down to the
 * components that need it. It's important that we create a single instance and
 * not a new instance per component or render; use useState with a lazy
 * initializer to accomplish this.
 */

const HIGHLIGHT_CLASS = 'collaborators-overlay-cursor-highlighted';

export function createCursorRegistry() {
	const cursorMap = new Map< number, HTMLElement >();
	// Tracks, per clientId, the timestamp a highlight started by
	// highlightCursor()/scrollToCursor() should end. Lets registerCursor()
	// below carry an in-progress highlight over to a replacement element
	// when the overlay swaps out which DOM node represents a clientId
	// mid-animation (e.g. a "hidden proxy" avatar being replaced by a real
	// cursor once revealed content finishes rendering) — reacting to the
	// actual swap, rather than guessing how long it takes to happen.
	const highlightEndTimes = new Map< number, number >();
	let editorDocument: Document | null = null;

	function scrollTo(
		element: HTMLElement,
		options?: ScrollToCursorOptions
	): void {
		element.scrollIntoView( {
			behavior: options?.behavior ?? 'smooth',
			block: options?.block ?? 'center',
			inline: options?.inline ?? 'nearest',
		} );
	}

	function startHighlight(
		clientId: number,
		element: HTMLElement,
		duration: number
	): void {
		const endTime = Date.now() + duration;
		highlightEndTimes.set( clientId, endTime );
		element.classList.add( HIGHLIGHT_CLASS );

		setTimeout( () => {
			element.classList.remove( HIGHLIGHT_CLASS );
			// Only clear the tracked end time if it's still the one this
			// timer belongs to — a swap in the meantime (registerCursor
			// carrying the highlight to a replacement element) would have
			// set a newer one, which this timer shouldn't clobber.
			if ( highlightEndTimes.get( clientId ) === endTime ) {
				highlightEndTimes.delete( clientId );
			}
		}, duration );
	}

	return {
		/**
		 * Register a cursor element when it's created.
		 *
		 * @param clientId - The clientId of the cursor to register.
		 * @param element  - The cursor element to register.
		 */
		registerCursor( clientId: number, element: HTMLElement ): void {
			cursorMap.set( clientId, element );

			const highlightEndTime = highlightEndTimes.get( clientId );
			if ( highlightEndTime === undefined ) {
				return;
			}
			const remainingMs = highlightEndTime - Date.now();
			if ( remainingMs > 0 ) {
				startHighlight( clientId, element, remainingMs );
			} else {
				highlightEndTimes.delete( clientId );
			}
		},

		/**
		 * Unregister a cursor element when it's removed.
		 *
		 * @param clientId - The clientId of the cursor to unregister.
		 */
		unregisterCursor( clientId: number ): void {
			cursorMap.delete( clientId );
		},

		/**
		 * Scroll to a cursor by clientId, and flash-highlight it.
		 *
		 * @param clientId - The clientId of the cursor to scroll to.
		 * @param options  - The options for the scroll and highlight.
		 * @return true if cursor was found and scrolled to, false otherwise.
		 */
		scrollToCursor(
			clientId: number,
			options?: ScrollToCursorOptions
		): boolean {
			const cursorElement = cursorMap.get( clientId );

			if ( ! cursorElement ) {
				return false;
			}

			scrollTo( cursorElement, options );
			if ( options?.highlightDuration ) {
				startHighlight(
					clientId,
					cursorElement,
					options.highlightDuration
				);
			}

			return true;
		},

		/**
		 * Scroll to a caller-supplied element directly, bypassing the
		 * clientId registry lookup. Use this when the element's own
		 * lifecycle is more stable than whatever is currently registered
		 * for a clientId — e.g. scrolling to a block itself rather than to
		 * its awareness overlay avatar, which re-renders (and can be
		 * unmounted/replaced) independently, driven by live awareness
		 * state that can change for reasons unrelated to this navigation.
		 *
		 * Scroll-only, no highlight: the highlight animation only works on
		 * the overlay's own avatar/cursor nodes (its CSS targets
		 * descendants like `.collaborators-overlay-user-cursor` that don't
		 * exist on an arbitrary block element). Pair this with
		 * highlightCursor(clientId) for the flash.
		 *
		 * @param element - The element to scroll to.
		 * @param options - The options for the scroll.
		 * @return Always true.
		 */
		scrollToElement(
			element: HTMLElement,
			options?: ScrollToCursorOptions
		): boolean {
			scrollTo( element, options );
			return true;
		},

		/**
		 * Flash-highlight a cursor by clientId, without scrolling to it.
		 * Pairs with scrollToElement, so a caller that scrolled to a stable
		 * block element (rather than the registry's own, possibly
		 * about-to-be-replaced avatar node) can still flash the
		 * collaborator's avatar for visual feedback, best-effort — a
		 * missing registration (e.g. their cursor hasn't rendered yet) is
		 * silently a no-op rather than an error.
		 *
		 * @param clientId - The clientId of the cursor to highlight.
		 * @param duration - Milliseconds the highlight should last.
		 * @return true if a cursor was found and highlighted, false otherwise.
		 */
		highlightCursor( clientId: number, duration: number ): boolean {
			const cursorElement = cursorMap.get( clientId );

			if ( ! cursorElement ) {
				return false;
			}

			startHighlight( clientId, cursorElement, duration );
			return true;
		},

		/**
		 * Store the editor iframe's document, so parts of the component
		 * tree that don't otherwise have access to it (e.g. the
		 * collaborators presence list, outside the canvas iframe) can look
		 * up block elements directly.
		 *
		 * @param doc - The editor iframe's document, or null when unmounted.
		 */
		setEditorDocument( doc: Document | null ): void {
			editorDocument = doc;
		},

		/**
		 * Retrieve the editor iframe's document, as last set via
		 * setEditorDocument.
		 *
		 * @return The editor iframe's document, or null if not yet set.
		 */
		getEditorDocument(): Document | null {
			return editorDocument;
		},

		/**
		 * Clear the registry.
		 */
		removeAll(): void {
			cursorMap.clear();
		},
	};
}

export type CursorRegistry = ReturnType< typeof createCursorRegistry >;
