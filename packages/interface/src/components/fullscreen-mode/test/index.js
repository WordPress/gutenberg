/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { FullscreenMode } from '..';

describe( 'FullscreenMode', () => {
	it( 'fullscreen mode to be added to document body when active', () => {
		shallow( <FullscreenMode isActive={ true } /> );

		expect( document.body.classList.contains( 'is-fullscreen-mode' ) ).toBe(
			true
		);
	} );

	it( 'fullscreen mode not to be added to document body when active', () => {
		shallow( <FullscreenMode isActive={ false } /> );

		expect( document.body.classList.contains( 'is-fullscreen-mode' ) ).toBe(
			false
		);
	} );

	it( 'sticky-menu to be removed from the body class if present', () => {
		document.body.classList.add( 'sticky-menu' );

		shallow( <FullscreenMode isActive={ false } /> );

		expect( document.body.classList.contains( 'sticky-menu' ) ).toBe(
			false
		);
	} );

	it( 'sticky-menu to be restored when component unmounted and originally present', () => {
		document.body.classList.add( 'sticky-menu' );

		const mode = shallow( <FullscreenMode isActive={ false } /> );
		mode.unmount();

		expect( document.body.classList.contains( 'sticky-menu' ) ).toBe(
			true
		);
	} );
} );
