/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import Media from '../media';
import type { FocalPointPickerMediaProps } from '../types';

type FocalPointPickerMediaTestProps = FocalPointPickerMediaProps & {
	'data-testid': string;
};

const props: FocalPointPickerMediaTestProps = {
	alt: '',
	src: '',
	'data-testid': 'media',
};

describe( 'FocalPointPicker/Media', () => {
	describe( 'Basic rendering', () => {
		it( 'should render', async () => {
			await render( <Media { ...props } /> );

			expect( screen.getByTestId( 'media' ) ).toBeVisible();
		} );
	} );

	describe( 'Media types', () => {
		it( 'should render a placeholder by default', async () => {
			await render( <Media { ...props } /> );

			expect( screen.getByTestId( 'media' ) ).toHaveClass(
				'components-focal-point-picker__media--placeholder'
			);
		} );

		it( 'should render an video if src is a video file', async () => {
			const { rerender } = await render(
				<Media { ...props } src="file.mp4" muted={ false } />
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'VIDEO' );

			await rerender(
				<Media { ...props } src="file.ogg" muted={ false } />
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'VIDEO' );

			await rerender(
				<Media { ...props } src="file.webm" muted={ false } />
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'VIDEO' );
		} );

		it( 'should render an image file, if not video', async () => {
			const { rerender } = await render(
				<Media { ...props } src="file.gif" />
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'IMG' );

			await rerender(
				<Media { ...props } src="file.png" muted={ false } />
			);

			expect( screen.getByTestId( 'media' ).tagName ).toBe( 'IMG' );
		} );
	} );
} );
