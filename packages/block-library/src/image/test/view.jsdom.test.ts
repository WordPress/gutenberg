import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { getElement, store } from '@wordpress/interactivity';

type ImageStore = {
	state: { overlayEnabled: boolean; metadata: Record< string, unknown > };
	actions: {
		handleKeydown: ( event: Partial< KeyboardEvent > ) => void;
		handleDocumentKeydown: ( event: Partial< KeyboardEvent > ) => void;
		hideLightbox: () => void;
	};
};

let mockRegisteredStore: ImageStore;
let mockElementRef: HTMLElement | null = null;

vi.mock( import( '@wordpress/interactivity' ), () => ( {
	store: ( ( name: string, config: ImageStore ) => {
		mockRegisteredStore = config;
		return config;
	} ) as unknown as typeof store,
	getElement: ( () => ( {
		ref: mockElementRef,
	} ) ) as unknown as typeof getElement,
	withSyncEvent: ( fn ) => fn,
} ) );

/**
 * Adds the lightbox overlay to the page, with the controls the server prints.
 *
 * @param options               Options.
 * @param options.hasNavigation Whether the Previous and Next buttons are visible.
 * @return The overlay element.
 */
function createOverlay( { hasNavigation }: { hasNavigation: boolean } ) {
	const overlay = document.createElement( 'div' );
	overlay.className = 'wp-lightbox-overlay zoom active';
	overlay.tabIndex = -1;
	overlay.innerHTML = `
		<button type="button" class="wp-lightbox-close-button">Close</button>
		<button type="button" class="wp-lightbox-navigation-button wp-lightbox-navigation-button-prev">Previous</button>
		<div class="lightbox-image-container"><figure><img alt=""></figure></div>
		<button type="button" class="wp-lightbox-navigation-button wp-lightbox-navigation-button-next">Next</button>
		<div class="scrim" aria-hidden="true"></div>
	`;
	overlay
		.querySelectorAll< HTMLButtonElement >(
			'.wp-lightbox-navigation-button'
		)
		.forEach( ( button ) => {
			button.hidden = ! hasNavigation;
		} );
	document.body.appendChild( overlay );
	mockElementRef = overlay;
	return overlay;
}

/**
 * Returns the control of the overlay that matches the passed selector.
 *
 * @param overlay  The overlay element.
 * @param selector The selector of the control.
 * @return The control.
 */
function getControl( overlay: HTMLElement, selector: string ) {
	return overlay.querySelector< HTMLButtonElement >( selector )!;
}

/**
 * Presses Tab, or Shift+Tab, on the focused element.
 *
 * @param options          Options.
 * @param options.shiftKey Whether Shift is held.
 * @return The keydown event passed to the handler.
 */
function pressTab( { shiftKey = false }: { shiftKey?: boolean } = {} ) {
	const event = {
		key: 'Tab',
		shiftKey,
		target: mockElementRef?.ownerDocument.activeElement,
		preventDefault: vi.fn(),
	};
	mockRegisteredStore.actions.handleKeydown( event );
	return event;
}

/**
 * Imports the view script, which registers the store, and opens the overlay.
 */
async function loadViewScript() {
	vi.resetModules();
	mockElementRef = null;
	// The path is not a literal because the script is JavaScript, outside of
	// the TypeScript project.
	const viewScript = '../view.js';
	await import( /* @vite-ignore */ viewScript );
	mockRegisteredStore.state.metadata = {};
	mockRegisteredStore.state.overlayEnabled = true;
}

describe( 'Image view script: lightbox focus trap', () => {
	beforeEach( loadViewScript );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	describe( 'for a single image, with the navigation buttons hidden', () => {
		it( 'keeps the focus on the Close button when pressing Tab', () => {
			const overlay = createOverlay( { hasNavigation: false } );
			const closeButton = getControl(
				overlay,
				'.wp-lightbox-close-button'
			);
			closeButton.focus();

			const event = pressTab();

			expect( event.preventDefault ).toHaveBeenCalled();
			expect( closeButton ).toHaveFocus();
		} );

		it( 'keeps the focus on the Close button when pressing Shift+Tab', () => {
			const overlay = createOverlay( { hasNavigation: false } );
			const closeButton = getControl(
				overlay,
				'.wp-lightbox-close-button'
			);
			closeButton.focus();

			const event = pressTab( { shiftKey: true } );

			expect( event.preventDefault ).toHaveBeenCalled();
			expect( closeButton ).toHaveFocus();
		} );

		it( 'moves the focus from the overlay to the Close button when pressing Shift+Tab', () => {
			const overlay = createOverlay( { hasNavigation: false } );
			overlay.focus();

			const event = pressTab( { shiftKey: true } );

			expect( event.preventDefault ).toHaveBeenCalled();
			expect(
				getControl( overlay, '.wp-lightbox-close-button' )
			).toHaveFocus();
		} );
	} );

	describe( 'for a gallery, with the navigation buttons visible', () => {
		it( 'lets Tab move the focus from the Close button to the next control', () => {
			const overlay = createOverlay( { hasNavigation: true } );
			getControl( overlay, '.wp-lightbox-close-button' ).focus();

			const event = pressTab();

			expect( event.preventDefault ).not.toHaveBeenCalled();
		} );

		it( 'moves the focus from the Next button to the Close button when pressing Tab', () => {
			const overlay = createOverlay( { hasNavigation: true } );
			getControl(
				overlay,
				'.wp-lightbox-navigation-button-next'
			).focus();

			const event = pressTab();

			expect( event.preventDefault ).toHaveBeenCalled();
			expect(
				getControl( overlay, '.wp-lightbox-close-button' )
			).toHaveFocus();
		} );

		it( 'moves the focus from the Close button to the Next button when pressing Shift+Tab', () => {
			const overlay = createOverlay( { hasNavigation: true } );
			getControl( overlay, '.wp-lightbox-close-button' ).focus();

			const event = pressTab( { shiftKey: true } );

			expect( event.preventDefault ).toHaveBeenCalled();
			expect(
				getControl( overlay, '.wp-lightbox-navigation-button-next' )
			).toHaveFocus();
		} );

		it( 'moves the focus from the overlay to the Next button when pressing Shift+Tab', () => {
			const overlay = createOverlay( { hasNavigation: true } );
			overlay.focus();

			const event = pressTab( { shiftKey: true } );

			expect( event.preventDefault ).toHaveBeenCalled();
			expect(
				getControl( overlay, '.wp-lightbox-navigation-button-next' )
			).toHaveFocus();
		} );
	} );

	it( 'ignores lightbox controls outside of the overlay', () => {
		const overlay = createOverlay( { hasNavigation: false } );
		// A control with the same class name elsewhere on the page.
		const otherControl = document.createElement( 'button' );
		otherControl.className = 'wp-lightbox-navigation-button';
		document.body.appendChild( otherControl );

		const closeButton = getControl( overlay, '.wp-lightbox-close-button' );
		closeButton.focus();

		const event = pressTab();

		expect( event.preventDefault ).toHaveBeenCalled();
		expect( closeButton ).toHaveFocus();
	} );

	it( 'does not trap the focus when the overlay is closed', () => {
		const overlay = createOverlay( { hasNavigation: false } );
		mockRegisteredStore.state.overlayEnabled = false;
		getControl( overlay, '.wp-lightbox-close-button' ).focus();

		const event = pressTab();

		expect( event.preventDefault ).not.toHaveBeenCalled();
	} );
} );

describe( 'Image view script: closing the lightbox with Escape', () => {
	beforeEach( async () => {
		// Closing the lightbox starts a cleanup timer.
		vi.useFakeTimers();
		await loadViewScript();
	} );

	afterEach( () => {
		vi.clearAllTimers();
		vi.useRealTimers();
		document.body.innerHTML = '';
	} );

	/**
	 * Presses a key on the passed element, as seen by the document listener.
	 *
	 * @param key                      The key.
	 * @param target                   The focused element.
	 * @param options                  Options.
	 * @param options.defaultPrevented Whether another handler already called
	 *                                 `preventDefault()`.
	 * @return The keydown event passed to the handler.
	 */
	function pressKeyOnDocument(
		key: string,
		target: Element,
		{ defaultPrevented = false }: { defaultPrevented?: boolean } = {}
	) {
		const event = {
			key,
			target,
			defaultPrevented,
			preventDefault: vi.fn(),
			stopPropagation: vi.fn(),
		};
		mockRegisteredStore.actions.handleDocumentKeydown( event );
		return event;
	}

	it( 'closes the overlay when Escape is pressed with the focus outside of it', () => {
		createOverlay( { hasNavigation: false } );

		pressKeyOnDocument( 'Escape', document.body );

		expect( mockRegisteredStore.state.overlayEnabled ).toBe( false );
	} );

	it( 'closes the overlay when Escape is pressed with the focus inside of it', () => {
		const overlay = createOverlay( { hasNavigation: false } );

		pressKeyOnDocument(
			'Escape',
			getControl( overlay, '.wp-lightbox-close-button' )
		);

		expect( mockRegisteredStore.state.overlayEnabled ).toBe( false );
	} );

	it( 'ignores other keys', () => {
		createOverlay( { hasNavigation: false } );

		pressKeyOnDocument( 'Enter', document.body );

		expect( mockRegisteredStore.state.overlayEnabled ).toBe( true );
	} );

	it( 'does nothing when the overlay is closed', () => {
		createOverlay( { hasNavigation: false } );
		mockRegisteredStore.state.overlayEnabled = false;
		const hideLightbox = vi.spyOn(
			mockRegisteredStore.actions,
			'hideLightbox'
		);

		const event = pressKeyOnDocument( 'Escape', document.body );

		expect( hideLightbox ).not.toHaveBeenCalled();
		expect( event.preventDefault ).not.toHaveBeenCalled();
		expect( event.stopPropagation ).not.toHaveBeenCalled();
	} );

	it( 'leaves an Escape that was already handled outside of the overlay', () => {
		createOverlay( { hasNavigation: false } );
		// For example, a dialog added to the page after the overlay opened.
		const otherDialog = document.createElement( 'div' );
		document.body.appendChild( otherDialog );

		pressKeyOnDocument( 'Escape', otherDialog, {
			defaultPrevented: true,
		} );

		expect( mockRegisteredStore.state.overlayEnabled ).toBe( true );
	} );

	it( 'closes the overlay when an Escape from inside of it was already handled', () => {
		const overlay = createOverlay( { hasNavigation: false } );

		pressKeyOnDocument(
			'Escape',
			getControl( overlay, '.wp-lightbox-close-button' ),
			{ defaultPrevented: true }
		);

		expect( mockRegisteredStore.state.overlayEnabled ).toBe( false );
	} );
} );
