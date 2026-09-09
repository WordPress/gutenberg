import { describe, expect, test } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { Heading } from '../';

describe( 'props', () => {
	test( 'should render correctly', async () => {
		await render( <Heading>Code is Poetry</Heading> );
		const heading = screen.getByRole( 'heading' );
		expect( heading.tagName ).toBe( 'H2' );
		expect( heading ).toHaveTextContent( 'Code is Poetry' );
		expect( getComputedStyle( heading ).fontWeight ).not.toBe( '400' );
	} );

	test( 'should render level as a number', async () => {
		await render( <Heading>Code is Poetry</Heading> );
		await render( <Heading level={ 4 }>Code is Poetry</Heading> );
		expect(
			getComputedStyle( screen.getByRole( 'heading', { level: 4 } ) )
				.fontSize
		).not.toBe(
			getComputedStyle( screen.getByRole( 'heading', { level: 2 } ) )
				.fontSize
		);
	} );

	test( 'should render level as a string', async () => {
		await render( <Heading>Code is Poetry</Heading> );
		await render( <Heading level="4">Code is Poetry</Heading> );
		expect(
			getComputedStyle( screen.getByRole( 'heading', { level: 4 } ) )
				.fontSize
		).not.toBe(
			getComputedStyle( screen.getByRole( 'heading', { level: 2 } ) )
				.fontSize
		);
	} );

	test( 'should allow as prop', async () => {
		await render(
			<Heading level="1" as="span">
				Code is Poetry
			</Heading>
		);
		expect( screen.getByRole( 'heading' ).tagName ).toBe( 'SPAN' );
	} );

	test( 'should render a11y props when not using a semantic element', async () => {
		await render(
			<Heading level="3" as="div">
				Code is Poetry
			</Heading>
		);
		expect(
			screen.getByRole( 'heading', { level: 3 } )
		).toBeInTheDocument();
	} );

	test( 'should not render a11y props when using a semantic element', async () => {
		await render(
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
