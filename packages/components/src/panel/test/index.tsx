/**
 * External dependencies
 */
import { screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import Panel from '..';

function createContainer() {
	const container = document.createElement( 'div' );
	document.body.appendChild( container );
	return container;
}

describe( 'Panel', () => {
	describe( 'basic rendering', () => {
		it( 'should render an empty div without any provided props', async () => {
			const container = createContainer();
			await render( <Panel children={ null } />, { container } );

			expect( container ).toMatchSnapshot();
		} );

		it( 'should render a heading when provided text in the header prop', async () => {
			await render( <Panel header="Header Label" children={ null } /> );

			const heading = screen.getByRole( 'heading' );
			expect( heading ).toBeVisible();
			expect( heading ).toHaveTextContent( 'Header Label' );
		} );

		it( 'should render an additional className', async () => {
			const container = createContainer();
			await render( <Panel className="the-panel" children={ null } />, {
				container,
			} );

			expect( container ).toMatchSnapshot();
		} );

		it( 'should add additional child elements to be rendered in the panel', async () => {
			await render(
				<Panel>
					<dfn>The Panel</dfn>
				</Panel>
			);

			const term = screen.getByRole( 'term' );
			expect( term ).toBeVisible();
			expect( term ).toHaveTextContent( 'The Panel' );
		} );

		it( 'should render both children and header when provided as props', async () => {
			await render(
				<Panel header="The header">
					<dfn>The Panel</dfn>
				</Panel>
			);

			const heading = screen.getByRole( 'heading' );
			expect( heading ).toBeVisible();
			expect( heading ).toHaveTextContent( 'The header' );

			const term = screen.getByRole( 'term' );
			expect( term ).toBeVisible();
			expect( term ).toHaveTextContent( 'The Panel' );
		} );
	} );
} );
