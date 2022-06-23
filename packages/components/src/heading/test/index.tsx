/**
 * External dependencies
 */
import { render, RenderResult } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Heading } from '../';

describe( 'props', () => {
	let base: RenderResult;
	beforeEach( () => {
		base = render( <Heading>Code is Poetry</Heading> );
	} );

	test( 'should render correctly', () => {
		expect( base.container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render level as a number', () => {
		const { container } = render(
			<Heading level={ 4 }>Code is Poetry</Heading>
		);
		expect( container.children[ 0 ] ).toMatchStyleDiffSnapshot(
			base.container.children[ 0 ]
		);
	} );

	test( 'should render level as a string', () => {
		const { container } = render(
			<Heading level="4">Code is Poetry</Heading>
		);
		expect( container.children[ 0 ] ).toMatchStyleDiffSnapshot(
			base.container.children[ 0 ]
		);
	} );

	test( 'should allow as prop', () => {
		const { container } = render(
			<Heading level="1" as="span">
				Code is Poetry
			</Heading>
		);
		expect( container.children[ 0 ].tagName ).toBe( 'SPAN' );
	} );

	test( 'should render a11y props when not using a semantic element', () => {
		const { container } = render(
			<Heading level="3" as="div">
				Code is Poetry
			</Heading>
		);
		expect( container.firstChild ).toHaveAttribute( 'role', 'heading' );
		expect( container.firstChild ).toHaveAttribute( 'aria-level', '3' );
	} );

	test( 'should not render a11y props when using a semantic element', () => {
		const { container } = render(
			<Heading level="1" as="h4">
				Code is Poetry
			</Heading>
		);
		expect( container.firstChild ).not.toHaveAttribute( 'role' );
		expect( container.firstChild ).not.toHaveAttribute( 'aria-level' );
	} );
} );
