/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Spinner } from '..';

describe( 'props', () => {
	let base;

	beforeEach( () => {
		base = render( <Spinner /> );
	} );

	test( 'should render correctly', () => {
		expect( base.container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render color', () => {
		const { container } = render( <Spinner color="blue" /> );
		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render size', () => {
		const { container } = render( <Spinner size={ 31 } /> );
		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );
} );
