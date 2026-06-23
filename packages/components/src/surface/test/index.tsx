/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { Surface } from '../index';
import type { SurfaceVariant } from '../types';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render( <Surface>Surface</Surface> );
		expect( container ).toMatchSnapshot();
	} );

	test.each< SurfaceVariant >( [
		'secondary',
		'tertiary',
		'dotted',
		'grid',
	] )( 'should render the %s variant', ( variant ) => {
		render( <Surface variant={ variant }>Surface</Surface> );
		expect( screen.getByText( 'Surface' ) ).toHaveAttribute(
			'data-variant',
			variant
		);
	} );

	test( 'should render borderLeft', () => {
		render( <Surface borderLeft>Surface</Surface> );
		expect( screen.getByText( 'Surface' ) ).toHaveAttribute(
			'data-border-left',
			'true'
		);
	} );

	test( 'should render borderRight', () => {
		render( <Surface borderRight>Surface</Surface> );
		expect( screen.getByText( 'Surface' ) ).toHaveAttribute(
			'data-border-right',
			'true'
		);
	} );

	test( 'should render borderTop', () => {
		render( <Surface borderTop>Surface</Surface> );
		expect( screen.getByText( 'Surface' ) ).toHaveAttribute(
			'data-border-top',
			'true'
		);
	} );

	test( 'should render borderBottom', () => {
		render( <Surface borderBottom>Surface</Surface> );
		expect( screen.getByText( 'Surface' ) ).toHaveAttribute(
			'data-border-bottom',
			'true'
		);
	} );

	test( 'should render background size custom properties for pattern variants', () => {
		render(
			<Surface variant="dotted" backgroundSize={ 24 }>
				Surface
			</Surface>
		);

		expect( screen.getByText( 'Surface' ) ).toHaveStyle( {
			'--wp-components-surface-background-size': '24px',
			'--wp-components-surface-background-size-dotted': '23px',
		} );
	} );
} );
