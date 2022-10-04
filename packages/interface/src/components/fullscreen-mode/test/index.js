/**
 * External dependencies
 */
import { act, create } from 'react-test-renderer';
/**
 * Internal dependencies
 */
import FullscreenMode from '..';

describe( 'FullscreenMode', () => {
	it( 'fullscreen mode to be added to document body when active', () => {
		act( () => {
			create( <FullscreenMode isActive={ true } /> );
		} );
		expect( document.body.classList.contains( 'is-fullscreen-mode' ) ).toBe(
			true
		);
	} );

	it( 'fullscreen mode not to be added to document body when active', () => {
		act( () => {
			create( <FullscreenMode isActive={ false } /> );
		} );
		expect( document.body.classList.contains( 'is-fullscreen-mode' ) ).toBe(
			false
		);
	} );

	it( 'sticky-menu to be removed from the body class if present', () => {
		document.body.classList.add( 'sticky-menu' );
		act( () => {
			create( <FullscreenMode isActive={ false } /> );
		} );
		expect( document.body.classList.contains( 'sticky-menu' ) ).toBe(
			false
		);
	} );

	it( 'sticky-menu to be restored when component unmounted and originally present', () => {
		document.body.classList.add( 'sticky-menu' );
		let mode;
		act( () => {
			mode = create( <FullscreenMode isActive={ false } /> );
		} );
		act( () => {
			mode.unmount();
		} );
		expect( document.body.classList.contains( 'sticky-menu' ) ).toBe(
			true
		);
	} );

	it( 'fullscreen mode to be removed from document body when component unmounted', () => {
		// Not present initially.
		expect( document.body.classList.contains( 'is-fullscreen-mode' ) ).toBe(
			false
		);
		let mode;
		act( () => {
			mode = create( <FullscreenMode isActive /> );
		} );
		// Present after mounting with `isActive`
		expect( document.body.classList.contains( 'is-fullscreen-mode' ) ).toBe(
			true
		);

		act( () => {
			mode.unmount();
		} );

		// Removed after unmounting.
		expect( document.body.classList.contains( 'is-fullscreen-mode' ) ).toBe(
			false
		);
	} );
} );
