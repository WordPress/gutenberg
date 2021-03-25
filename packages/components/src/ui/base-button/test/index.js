/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { BaseButton } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render( <BaseButton>Code is Poetry</BaseButton> );
		expect( container.firstChild ).toMatchSnapshot();
	} );
} );
