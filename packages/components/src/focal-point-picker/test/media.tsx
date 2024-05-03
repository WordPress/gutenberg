/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Media from '../media';
import type { FocalPointPickerMediaProps } from '../types';

const props: FocalPointPickerMediaProps = {
	alt: '',
	src: '',
};

describe( 'FocalPointPicker/Media', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', () => {
			render( <Media { ...props } data-testid="media" /> );

			expect( screen.getByTestId( 'media' ) ).toBeVisible();
		} );
	} );

	describe( 'Media types', () => {
		it( 'should render a placeholder by default', () => {
			render( <Media { ...props } data-testid="media" /> );

			expect( screen.getByTestId( 'media' ) ).toHaveClass(
				'components-focal-point-picker__media--placeholder'
			);
		} );

		it( 'should render an video if src is a video file', () => {
			const { rerender } = render(
				<Media
					{ ...props }
					src="file.mp4"
					muted={ false }
					data-testid="media"
				/>
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'VIDEO' );

			rerender(
				<Media
					{ ...props }
					src="file.ogg"
					muted={ false }
					data-testid="media"
				/>
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'VIDEO' );

			rerender(
				<Media
					{ ...props }
					src="file.webm"
					muted={ false }
					data-testid="media"
				/>
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'VIDEO' );
		} );

		it( 'should render an image file, if not video', () => {
			const { rerender } = render(
				<Media { ...props } src="file.gif" data-testid="media" />
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'IMG' );

			rerender(
				<Media
					{ ...props }
					src="file.png"
					muted={ false }
					data-testid="media"
				/>
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'IMG' );
		} );
	} );
} );
