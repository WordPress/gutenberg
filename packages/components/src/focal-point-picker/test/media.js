/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Media from '../media';

describe( 'FocalPointPicker/Media', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			render( <Media data-testid="media" /> );

			expect( screen.getByTestId( 'media' ) ).toBeVisible();
		} );
	} );

	describe( 'Media types', () => {
		it( 'should render a placeholder by default', () => {
			render( <Media data-testid="media" /> );

			expect( screen.getByTestId( 'media' ) ).toHaveClass(
				'components-focal-point-picker__media--placeholder'
			);
		} );

		it( 'should render an video if src is a video file', () => {
			const { rerender } = render(
				<Media src="file.mp4" muted={ false } data-testid="media" />
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'VIDEO' );

			rerender(
				<Media src="file.ogg" muted={ false } data-testid="media" />
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'VIDEO' );

			rerender(
				<Media src="file.webm" muted={ false } data-testid="media" />
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'VIDEO' );
		} );

		it( 'should render an image file, if not video', () => {
			const { rerender } = render(
				<Media src="file.gif" data-testid="media" />
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'IMG' );

			rerender(
				<Media src="file.png" muted={ false } data-testid="media" />
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'IMG' );
		} );
	} );
} );
