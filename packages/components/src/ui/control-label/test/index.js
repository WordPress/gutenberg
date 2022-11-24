/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { ControlLabel } from '../index';

describe( 'props', () => {
	test( 'should render correctly', () => {
		const { container } = render( <ControlLabel>Label</ControlLabel> );

		expect( container ).toMatchSnapshot();
	} );

	test( 'should render htmlFor', () => {
		render( <ControlLabel htmlFor="Field">Label</ControlLabel> );

		expect( screen.getByText( 'Label' ) ).toHaveAttribute( 'for', 'Field' );
	} );

	test( 'should render size', () => {
		const { container } = render(
			<ControlLabel size="small">Label</ControlLabel>
		);

		expect( container ).toMatchSnapshot();
	} );

	test( 'should render no truncate', () => {
		const { container } = render(
			<ControlLabel truncate={ false }>Label</ControlLabel>
		);

		expect( container ).toMatchSnapshot();
	} );
} );
