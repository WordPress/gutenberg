/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Media from '../media';

const getMedia = ( container ) =>
	container.querySelector( '.components-focal-point-picker__media' );

describe( 'FocalPointPicker/Media', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			const { container } = render( <Media /> );
			const el = getMedia( container );

			expect( el ).toBeTruthy();
		} );
	} );

	describe( 'Media types', () => {
		it( 'should render a placeholder by default', () => {
			const { container } = render( <Media /> );
			const el = getMedia( container );

			expect( el.outerHTML ).toContain( 'placeholder' );
		} );

		it( 'should render an video if src is a video file', () => {
			const { container, rerender } = render(
				<Media src="file.mp4" muted={ false } />
			);

			expect( getMedia( container ).tagName ).toBe( 'VIDEO' );

			rerender( <Media src="file.ogg" muted={ false } /> );

			expect( getMedia( container ).tagName ).toBe( 'VIDEO' );

			rerender( <Media src="file.webm" muted={ false } /> );

			expect( getMedia( container ).tagName ).toBe( 'VIDEO' );
		} );

		it( 'should render an image file, if not video', () => {
			const { container, rerender } = render( <Media src="file.gif" /> );

			expect( getMedia( container ).tagName ).toBe( 'IMG' );

			rerender( <Media src="file.png" muted={ false } /> );

			expect( getMedia( container ).tagName ).toBe( 'IMG' );
		} );
	} );
} );
