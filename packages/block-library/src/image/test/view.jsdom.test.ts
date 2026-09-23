import { beforeEach, describe, expect, test, vi } from 'vitest';

type ImageStore = {
	state: { overlayEnabled: boolean };
	actions: {
		hideLightbox: () => void;
		handleOverlayClick: ( event: MouseEvent ) => void;
		handleKeydown: ( event: KeyboardEvent ) => void;
	};
};

let registeredStore: ImageStore;

vi.mock( '@wordpress/interactivity', () => ( {
	store: ( _name: string, config: ImageStore ) => {
		registeredStore = config;
		return config;
	},
	getContext: () => ( {} ),
	getElement: () => ( {} ),
	getConfig: () => ( {} ),
	withSyncEvent: < T >( callback: T ) => callback,
	withScope: < T >( callback: T ) => callback,
} ) );

describe( 'Image lightbox click handling', () => {
	let overlay: HTMLDivElement;

	beforeEach( async () => {
		vi.resetModules();
		await import( '../view.js' );
		vi.spyOn( registeredStore.actions, 'hideLightbox' ).mockImplementation(
			() => {}
		);
		overlay = document.createElement( 'div' );
		overlay.className = 'wp-lightbox-overlay';
		overlay.innerHTML = `<button><span>Close</span><svg><path /></svg></button>
			<figure><img alt="Example" /><figcaption class="lightbox-caption">
				Plain text <strong>formatted text</strong><a href="#credit"><em>Credit</em></a>
			</figcaption></figure><div class="scrim"></div>`;
	} );

	test.each( [ 'figcaption', 'strong', 'a', 'em' ] )(
		'does not close or cancel a click on caption %s',
		( selector ) => {
			const event = new MouseEvent( 'click', {
				bubbles: true,
				cancelable: true,
			} );
			overlay.querySelector( selector )!.dispatchEvent( event );
			// The target remains available after dispatch, unlike currentTarget.
			expect( event.currentTarget ).toBeNull();
			registeredStore.actions.handleOverlayClick( event );
			expect(
				registeredStore.actions.hideLightbox
			).not.toHaveBeenCalled();
			expect( event.defaultPrevented ).toBe( false );
		}
	);

	test.each( [ 'img', 'button', 'span', 'path', '.scrim' ] )(
		'closes the lightbox when %s is clicked',
		( selector ) => {
			const event = new MouseEvent( 'click', { bubbles: true } );
			overlay.querySelector( selector )!.dispatchEvent( event );
			registeredStore.actions.handleOverlayClick( event );
			expect(
				registeredStore.actions.hideLightbox
			).toHaveBeenCalledWith();
		}
	);

	test( 'closes when the overlay itself is clicked', () => {
		const event = new MouseEvent( 'click' );
		overlay.dispatchEvent( event );
		registeredStore.actions.handleOverlayClick( event );
		expect( registeredStore.actions.hideLightbox ).toHaveBeenCalledWith();
	} );

	test( 'keeps Escape independent of the overlay click event', () => {
		registeredStore.state.overlayEnabled = true;
		registeredStore.actions.handleKeydown(
			new KeyboardEvent( 'keydown', { key: 'Escape' } )
		);
		expect( registeredStore.actions.hideLightbox ).toHaveBeenCalledWith();
	} );
} );
