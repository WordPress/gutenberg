/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Surface } from '../index';

describe( 'props', () => {
	let base;
	beforeEach( () => {
		base = render( <Surface>Surface</Surface> );
	} );

	test( 'should render correctly', () => {
		expect( base.container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render variants', () => {
		const { container } = render(
			<Surface variant="secondary">Surface</Surface>
		);
		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render borderLeft', () => {
		const { container } = render( <Surface borderLeft>Surface</Surface> );
		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render borderRight', () => {
		const { container } = render( <Surface borderRight>Surface</Surface> );
		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render borderTop', () => {
		const { container } = render( <Surface borderTop>Surface</Surface> );
		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render borderBottom', () => {
		const { container } = render( <Surface borderBottom>Surface</Surface> );
		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );
} );
