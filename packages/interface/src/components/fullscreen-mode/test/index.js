/**
 * External dependencies
 */
import { render } from '@testing-library/react';
/**
 * Internal dependencies
 */
import FullscreenMode from '..';

describe( 'FullscreenMode', () => {
	it( 'fullscreen mode to be added to document body when active', () => {
		const { baseElement } = render( <FullscreenMode isActive /> );

		expect( baseElement ).toHaveClass( 'is-fullscreen-mode' );
	} );

	it( 'fullscreen mode not to be added to document body when active', () => {
		const { baseElement } = render( <FullscreenMode isActive={ false } /> );

		expect( baseElement ).not.toHaveClass( 'is-fullscreen-mode' );
	} );

	it( 'sticky-menu to be removed from the body class if present', () => {
		document.body.classList.add( 'sticky-menu' );

		const { baseElement } = render( <FullscreenMode isActive={ false } /> );

		expect( baseElement ).not.toHaveClass( 'sticky-menu' );
	} );

	it( 'sticky-menu to be restored when component unmounted and originally present', () => {
		document.body.classList.add( 'sticky-menu' );
		const { baseElement, unmount } = render(
			<FullscreenMode isActive={ false } />
		);

		unmount();

		expect( baseElement ).toHaveClass( 'sticky-menu' );
	} );

	it( 'fullscreen mode to be removed from document body when component unmounted', () => {
		const { baseElement, unmount } = render( <FullscreenMode isActive /> );

		// Present after mounting with `isActive`
		expect( baseElement ).toHaveClass( 'is-fullscreen-mode' );

		unmount();

		// Removed after unmounting.
		expect( baseElement ).not.toHaveClass( 'is-fullscreen-mode' );
	} );
} );
