/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Heading } from '../';

describe( 'props', () => {
	test( 'should render correctly', () => {
		render( <Heading>Code is Poetry</Heading> );
		expect( screen.getByRole( 'heading' ) ).toMatchSnapshot();
	} );

	test( 'should render level as a number', () => {
		render( <Heading>Code is Poetry</Heading> );
		render( <Heading level={ 4 }>Code is Poetry</Heading> );
		expect(
			screen.getByRole( 'heading', { level: 4 } )
		).toMatchStyleDiffSnapshot(
			screen.getByRole( 'heading', { level: 2 } )
		);
	} );

	test( 'should render level as a string', () => {
		render( <Heading>Code is Poetry</Heading> );
		render( <Heading level="4">Code is Poetry</Heading> );
		expect(
			screen.getByRole( 'heading', { level: 4 } )
		).toMatchStyleDiffSnapshot(
			screen.getByRole( 'heading', { level: 2 } )
		);
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
