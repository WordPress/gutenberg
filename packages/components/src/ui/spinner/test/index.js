/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Spinner } from '..';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const base = render( <Spinner /> );
		expect( base.container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render color', () => {
		const base = render( <Spinner /> );
		const { container } = render( <Spinner color="blue" /> );
		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );

	test( 'should render size', () => {
		const base = render( <Spinner /> );
		const { container } = render( <Spinner size={ 31 } /> );
		expect( container.firstChild ).toMatchDiffSnapshot(
			base.container.firstChild
		);
	} );
} );
