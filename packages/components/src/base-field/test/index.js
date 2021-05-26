/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { BaseField } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render( <BaseField /> );
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
