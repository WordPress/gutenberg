/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import PanelRow from '../row';

function createContainer() {
	const container = document.createElement( 'div' );
	document.body.appendChild( container );
	return container;
}

describe( 'PanelRow', () => {
	it( 'should render with the default class name', async () => {
		const container = createContainer();
		await render( <PanelRow children={ null } />, { container } );

		expect( container ).toMatchSnapshot();
	} );

	it( 'should render with the custom class name', async () => {
		const container = createContainer();
		await render( <PanelRow className="custom" children={ null } />, {
			container,
		} );

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
