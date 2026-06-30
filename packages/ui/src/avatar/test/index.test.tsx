import { render, screen, waitFor } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import * as Avatar from '../index';

function mockImageLoadSuccess() {
	class MockImage {
		onload: ( () => void ) | null = null;
		onerror: ( () => void ) | null = null;
		complete = true;
		naturalWidth = 1;

		set src( _value: string ) {
			this.onload?.();
		}
	}

	return jest
		.spyOn( window, 'Image' )
		.mockImplementation(
			() => new MockImage() as unknown as HTMLImageElement
		);
}

describe( 'Avatar', () => {
	afterEach( () => {
		jest.restoreAllMocks();
	} );

	describe( 'ref forwarding', () => {
		it( 'forwards ref on Root', () => {
			const ref = createRef< HTMLSpanElement >();
			render(
				<Avatar.Root ref={ ref } data-testid="avatar">
					<Avatar.Fallback>AB</Avatar.Fallback>
				</Avatar.Root>
			);
			expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
		} );

		it( 'forwards ref on Fallback', () => {
			const ref = createRef< HTMLSpanElement >();
			render(
				<Avatar.Root>
					<Avatar.Fallback ref={ ref }>AB</Avatar.Fallback>
				</Avatar.Root>
			);
			expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
		} );
	} );

	describe( 'sizes', () => {
		it( 'applies the default md size class', () => {
			const ref = createRef< HTMLSpanElement >();
			render(
				<Avatar.Root ref={ ref }>
					<Avatar.Fallback>AB</Avatar.Fallback>
				</Avatar.Root>
			);
			expect( ref.current?.className ).toContain( 'is-md-size' );
		} );

		it( 'applies the sm size class', () => {
			const ref = createRef< HTMLSpanElement >();
			render(
				<Avatar.Root ref={ ref } size="sm">
					<Avatar.Fallback>AB</Avatar.Fallback>
				</Avatar.Root>
			);
			expect( ref.current?.className ).toContain( 'is-sm-size' );
		} );
	} );

	describe( 'outlineColor', () => {
		it( 'sets the outline color CSS variable and class', () => {
			const ref = createRef< HTMLSpanElement >();
			render(
				<Avatar.Root ref={ ref } outlineColor="#3858e9">
					<Avatar.Fallback>AB</Avatar.Fallback>
				</Avatar.Root>
			);
			expect( ref.current?.className ).toContain( 'has-outline-color' );
			expect(
				ref.current?.style.getPropertyValue(
					'--wp-ui-avatar-outline-color'
				)
			).toBe( '#3858e9' );
		} );
	} );

	describe( 'image and fallback', () => {
		it( 'shows fallback content when no image is provided', () => {
			render(
				<Avatar.Root>
					<Avatar.Fallback>AB</Avatar.Fallback>
				</Avatar.Root>
			);
			expect( screen.getByText( 'AB' ) ).toBeInTheDocument();
		} );

		it( 'renders an image when src is provided', async () => {
			mockImageLoadSuccess();

			render(
				<Avatar.Root>
					<Avatar.Image
						src="https://example.com/avatar.jpg"
						alt="Jane Doe"
					/>
					<Avatar.Fallback>JD</Avatar.Fallback>
				</Avatar.Root>
			);

			await waitFor( () => {
				expect(
					screen.getByRole( 'img', { name: 'Jane Doe' } )
				).toHaveAttribute( 'src', 'https://example.com/avatar.jpg' );
			} );

			await waitFor( () => {
				expect( screen.queryByText( 'JD' ) ).not.toBeInTheDocument();
			} );
		} );

		it( 'shows fallback content when the image fails to load', async () => {
			class MockImage {
				onload: ( () => void ) | null = null;
				onerror: ( () => void ) | null = null;
				complete = true;
				naturalWidth = 0;

				set src( _value: string ) {
					this.onerror?.();
				}
			}

			jest.spyOn( window, 'Image' ).mockImplementation(
				() => new MockImage() as unknown as HTMLImageElement
			);

			render(
				<Avatar.Root>
					<Avatar.Image src="https://example.com/bad.jpg" alt="" />
					<Avatar.Fallback>JD</Avatar.Fallback>
				</Avatar.Root>
			);

			await waitFor( () => {
				expect( screen.getByText( 'JD' ) ).toBeInTheDocument();
			} );
		} );
	} );

	describe( 'custom className', () => {
		it( 'applies className to Root', () => {
			const ref = createRef< HTMLSpanElement >();
			render(
				<Avatar.Root ref={ ref } className="custom-root">
					<Avatar.Fallback>AB</Avatar.Fallback>
				</Avatar.Root>
			);
			expect( ref.current ).toHaveClass( 'custom-root' );
		} );
	} );
} );
