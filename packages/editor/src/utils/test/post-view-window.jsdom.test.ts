import { afterEach, describe, expect, it, vi } from 'vitest';
import { onPostViewLinkClick, openPostView } from '../post-view-target';

afterEach( () => {
	vi.restoreAllMocks();
} );

function fakeWindow() {
	return { opener: {}, location: '' } as unknown as Window;
}

function clickOn(
	attrs: { href: string; target: string },
	init: Partial< MouseEvent > = {}
) {
	const link = document.createElement( 'a' );
	link.href = attrs.href;
	link.target = attrs.target;
	const event = {
		currentTarget: link,
		button: 0,
		metaKey: false,
		ctrlKey: false,
		shiftKey: false,
		altKey: false,
		defaultPrevented: false,
		preventDefault: vi.fn(),
		...init,
	};
	onPostViewLinkClick(
		event as unknown as React.MouseEvent< HTMLAnchorElement >
	);
	return event;
}

describe( 'onPostViewLinkClick', () => {
	// A named target gets no implicit `noopener`, so clear the opener before the
	// post loads. The window stays reachable by name while it is same origin.
	it( 'opens the named window with its opener cleared', () => {
		const viewWindow = fakeWindow();
		const open = vi.spyOn( window, 'open' ).mockReturnValue( viewWindow );
		const event = clickOn( {
			href: 'http://localhost/hello/',
			target: 'wp-post-1',
		} );
		expect( open ).toHaveBeenCalledWith( '', 'wp-post-1' );
		expect( viewWindow.opener ).toBeNull();
		expect( viewWindow.location ).toBe( 'http://localhost/hello/' );
		expect( event.preventDefault ).toHaveBeenCalled();
	} );

	it( 'leaves a _blank link to the browser, which adds noopener itself', () => {
		const open = vi.spyOn( window, 'open' );
		const event = clickOn( {
			href: 'http://localhost/hello/',
			target: '_blank',
		} );
		expect( open ).not.toHaveBeenCalled();
		expect( event.preventDefault ).not.toHaveBeenCalled();
	} );

	it.each( [
		[ 'meta', { metaKey: true } ],
		[ 'ctrl', { ctrlKey: true } ],
		[ 'shift', { shiftKey: true } ],
		[ 'middle button', { button: 1 } ],
	] )( 'leaves a %s click to the browser', ( _label, init ) => {
		const open = vi.spyOn( window, 'open' );
		const event = clickOn(
			{ href: 'http://localhost/hello/', target: 'wp-post-1' },
			init
		);
		expect( open ).not.toHaveBeenCalled();
		expect( event.preventDefault ).not.toHaveBeenCalled();
	} );

	it( 'follows the link normally when the popup is blocked', () => {
		vi.spyOn( window, 'open' ).mockReturnValue( null );
		const event = clickOn( {
			href: 'http://localhost/hello/',
			target: 'wp-post-1',
		} );
		expect( event.preventDefault ).not.toHaveBeenCalled();
	} );

	it( 'still navigates when the window is already on another origin', () => {
		const viewWindow = {
			set opener( _value: unknown ) {
				throw new DOMException( 'Blocked', 'SecurityError' );
			},
			location: '',
		} as unknown as Window;
		vi.spyOn( window, 'open' ).mockReturnValue( viewWindow );
		clickOn( { href: 'http://localhost/hello/', target: 'wp-post-1' } );
		expect( viewWindow.location ).toBe( 'http://localhost/hello/' );
	} );
} );

describe( 'openPostView', () => {
	it( 'asks for noopener on the _blank fallback', () => {
		const open = vi.spyOn( window, 'open' ).mockReturnValue( null );
		openPostView( 'http://localhost/hello/', '_blank' );
		expect( open ).toHaveBeenCalledWith(
			'http://localhost/hello/',
			'_blank',
			'noopener'
		);
	} );

	it( 'clears the opener on the named window', () => {
		const viewWindow = fakeWindow();
		const open = vi.spyOn( window, 'open' ).mockReturnValue( viewWindow );
		openPostView( 'http://localhost/hello/', 'wp-post-1' );
		expect( open ).toHaveBeenCalledWith( '', 'wp-post-1' );
		expect( viewWindow.opener ).toBeNull();
		expect( viewWindow.location ).toBe( 'http://localhost/hello/' );
	} );
} );
