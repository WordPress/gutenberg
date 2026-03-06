import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import * as Card from '../index';

describe( 'Card', () => {
	describe( 'basic behaviour', () => {
		it( 'forwards ref', () => {
			const rootRef = createRef< HTMLDivElement >();
			const headerRef = createRef< HTMLDivElement >();
			const contentRef = createRef< HTMLDivElement >();
			const fullBleedRef = createRef< HTMLDivElement >();
			const titleRef = createRef< HTMLDivElement >();

			render(
				<Card.Root ref={ rootRef }>
					<Card.Header ref={ headerRef }>
						<Card.Title ref={ titleRef }>Title</Card.Title>
					</Card.Header>
					<Card.Content ref={ contentRef }>
						<Card.FullBleed ref={ fullBleedRef }>
							Full width
						</Card.FullBleed>
					</Card.Content>
				</Card.Root>
			);

			expect( rootRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( headerRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( contentRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( fullBleedRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( titleRef.current ).toBeInstanceOf( HTMLDivElement );
		} );

		it( 'renders content', () => {
			render(
				<Card.Root>
					<Card.Header>
						<Card.Title>Card heading</Card.Title>
					</Card.Header>
					<Card.Content>
						<p>Main content</p>
					</Card.Content>
				</Card.Root>
			);

			expect( screen.getByText( 'Card heading' ) ).toBeVisible();
			expect( screen.getByText( 'Main content' ) ).toBeVisible();
		} );
	} );

	describe( 'fullbleed', () => {
		it( 'renders children', () => {
			render(
				<Card.Root>
					<Card.Content>
						<Card.FullBleed>
							<img
								src="https://example.com/image.jpg"
								alt="test"
							/>
						</Card.FullBleed>
					</Card.Content>
				</Card.Root>
			);

			expect( screen.getByRole( 'img', { name: 'test' } ) ).toBeVisible();
		} );
	} );

	describe( 'render prop', () => {
		it( 'allows Root to render as a different element', () => {
			render(
				<Card.Root render={ <section /> } data-testid="card">
					<Card.Content>Content</Card.Content>
				</Card.Root>
			);

			expect( screen.getByTestId( 'card' ).tagName ).toBe( 'SECTION' );
		} );

		it( 'allows Title to render as a heading element', () => {
			render(
				<Card.Root>
					<Card.Header>
						{ /* eslint-disable-next-line jsx-a11y/heading-has-content -- content provided via render prop */ }
						<Card.Title render={ <h2 /> }>Heading</Card.Title>
					</Card.Header>
				</Card.Root>
			);

			expect(
				screen.getByRole( 'heading', { level: 2, name: 'Heading' } )
			).toBeVisible();
		} );
	} );
} );
