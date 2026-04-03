import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Text } from '../index';

describe( 'Text', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLSpanElement >();

		render( <Text ref={ ref }>Content</Text> );

		expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
	} );

	it( 'renders children', () => {
		render( <Text>Hello world</Text> );

		expect( screen.getByText( 'Hello world' ) ).toBeVisible();
	} );

	it( 'forwards props to the rendered element', () => {
		render( <Text data-testid="text">Content</Text> );

		expect( screen.getByTestId( 'text' ) ).toBeInTheDocument();
	} );

	it( 'forwards the className to the rendered element', () => {
		render(
			<Text data-testid="text" className="custom-class">
				Content
			</Text>
		);

		expect( screen.getByTestId( 'text' ) ).toHaveClass( 'custom-class' );
	} );

	it( 'supports the render prop', () => {
		render(
			// eslint-disable-next-line jsx-a11y/heading-has-content
			<Text render={ <h2 /> }>Section title</Text>
		);

		expect(
			screen.getByRole( 'heading', { level: 2, name: 'Section title' } )
		).toBeVisible();
	} );
} );
