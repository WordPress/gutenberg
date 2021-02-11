/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import { ui } from '@wp-g2/styles';

/**
 * Internal dependencies
 */
import { Divider } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render( <Divider /> );

		expect( container.firstChild ).toContainHTML( 'hr' );
		expect( container.firstChild ).toHaveAttribute( 'role', 'separator' );
	} );

	test( 'should render marginTop', () => {
		const { container } = render( <Divider mt={ 5 } /> );

		expect( container.firstChild ).toHaveStyle( {
			marginTop: ui.space( 5 ),
			marginBottom: 0,
		} );
	} );

	test( 'should render marginBottom', () => {
		const { container } = render( <Divider mb={ 5 } /> );

		expect( container.firstChild ).toHaveStyle( {
			marginBottom: ui.space( 5 ),
			marginTop: 0,
		} );
	} );

	test( 'should render margin', () => {
		const { container } = render( <Divider m={ 7 } /> );

		expect( container.firstChild ).toHaveStyle( {
			marginTop: ui.space( 7 ),
			marginBottom: ui.space( 7 ),
		} );
	} );
} );
