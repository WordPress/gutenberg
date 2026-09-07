import { render, screen } from '@testing-library/react';
import { Heading } from '../';

describe( 'props', () => {
	test( 'should render correctly', () => {
		render( <Heading>Code is Poetry</Heading> );
		expect( screen.getByRole( 'heading' ) ).toMatchSnapshot();
	} );

	test( 'should allow as prop', () => {
		render(
			<Heading level="1" as="span">
				Code is Poetry
			</Heading>
		);
		expect( screen.getByRole( 'heading' ).tagName ).toBe( 'SPAN' );
	} );

	test( 'should render a11y props when not using a semantic element', () => {
		render(
			<Heading level="3" as="div">
				Code is Poetry
			</Heading>
		);
		expect(
			screen.getByRole( 'heading', { level: 3 } )
		).toBeInTheDocument();
	} );

	test( 'should not render a11y props when using a semantic element', () => {
		render(
			<Heading level="1" as="h4">
				Code is Poetry
			</Heading>
		);
		expect( screen.getByRole( 'heading' ) ).not.toHaveAttribute( 'role' );
		expect( screen.getByRole( 'heading' ) ).not.toHaveAttribute(
			'aria-level'
		);
	} );
} );
