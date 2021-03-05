/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Heading } from '../index';

describe( 'props', () => {
	let base;
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
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render level as a string', () => {
		const { container } = render(
			<Heading level="4">Code is Poetry</Heading>
		);
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should allow as prop', () => {
		const { container } = render(
			<Heading level="1" as="span">
				Code is Poetry
			</Heading>
		);
		expect( container.firstChild.tagName ).toBe( 'SPAN' );
	} );
} );
