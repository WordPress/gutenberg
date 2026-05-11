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

function highlightCursor( element: HTMLElement, duration: number ): void {
	element.classList.add( 'collaborators-overlay-cursor-highlighted' );

	setTimeout( () => {
		element.classList.remove( 'collaborators-overlay-cursor-highlighted' );
	}, duration );
}

export function createCursorRegistry() {
	const cursorMap = new Map< number, HTMLElement >();

	return {
		/**
		 * Register a cursor element when it's created.
		 *
		 * @param clientId - The clientId of the cursor to register.
		 * @param element  - The cursor element to register.
		 */
		registerCursor( clientId: number, element: HTMLElement ): void {
			cursorMap.set( clientId, element );
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
		 * Scroll to a cursor by clientId.
		 *
		 * @param clientId - The clientId of the cursor to scroll to.
		 * @param options  - The options for the scroll.
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

			cursorElement.scrollIntoView( {
				behavior: options?.behavior ?? 'smooth',
				block: options?.block ?? 'center',
				inline: options?.inline ?? 'nearest',
			} );

			if ( options?.highlightDuration ) {
				highlightCursor( cursorElement, options.highlightDuration );
			}

			return true;
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
