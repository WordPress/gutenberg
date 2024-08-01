/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import PanelRow from '../row';

describe( 'PanelRow', () => {
	it( 'should render with the default class name', async () => {
		const { container } = await render( <PanelRow children={ null } /> );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render with the custom class name', async () => {
		const { container } = await render(
			<PanelRow className="custom" children={ null } />
		);

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render child components', async () => {
		await render(
			<PanelRow>
				<dfn>Some text</dfn>
			</PanelRow>
		);

		const term = screen.getByRole( 'term' );
		expect( term ).toBeVisible();
		expect( term ).toHaveTextContent( 'Some text' );
	} );
} );
