/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Elevation } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render( <Elevation /> );

		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render isInteractive', () => {
		const { container } = render( <Elevation isInteractive /> );

		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render value', () => {
		const { container } = render( <Elevation value={ 7 } /> );

		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render hover', () => {
		const { container } = render( <Elevation hover={ 14 } value={ 7 } /> );

		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render active', () => {
		const { container } = render(
			<Elevation active={ 5 } hover={ 14 } value={ 7 } />
		);

		expect( container.firstChild ).toMatchSnapshot();
	} );

	test( 'should render offset', () => {
		const { container } = render(
			<Elevation active={ 5 } hover={ 14 } offset={ -2 } value={ 7 } />
		);

		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
