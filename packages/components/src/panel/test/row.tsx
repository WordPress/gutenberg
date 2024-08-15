/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import PanelRow from '../row';

describe( 'PanelRow', () => {
	it( 'should render with the default class name', () => {
		const { container } = render( <PanelRow children={ null } /> );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render with the custom class name', () => {
		const { container } = render(
			<PanelRow className="custom" children={ null } />
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render child components', () => {
		render(
			<PanelRow>
				<dfn>Some text</dfn>
			</PanelRow>
		);

		const term = screen.getByRole( 'term' );
		expect( term ).toBeVisible();
		expect( term ).toHaveTextContent( 'Some text' );
	} );
} );
