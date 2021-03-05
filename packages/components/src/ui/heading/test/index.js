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

	test( 'should render size', () => {
		const { container } = render(
			<Heading size={ 2 }>Code is Poetry</Heading>
		);
		expect( container.firstChild ).toMatchStyleDiffSnapshot(
			base.container.firstChild
		);
	} );
} );
