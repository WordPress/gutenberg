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

	test( 'should render correctly', () => {
		base = render( <Spinner /> );
		expect( base.container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render color', () => {
		base = render( <Spinner /> );
		const { container } = render( <Spinner color="blue" /> );
		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render size', () => {
		base = render( <Spinner /> );
		const { container } = render( <Spinner size={ 31 } /> );
		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );
} );
