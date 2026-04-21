/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Panel from '..';

describe( 'Panel', () => {
	describe( 'basic rendering', () => {
		it( 'should render an empty div without any provided props', () => {
			const { container } = render( <Panel children={ null } /> );

			expect( container ).toMatchSnapshot();
		} );

		it( 'should render a heading when provided text in the header prop', () => {
			render( <Panel header="Header Label" children={ null } /> );

			const heading = screen.getByRole( 'heading' );
			expect( heading ).toBeVisible();
			expect( heading ).toHaveTextContent( 'Header Label' );
		} );

		it( 'should render an additional className', () => {
			const { container } = render(
				<Panel className="the-panel" children={ null } />
			);

			expect( container ).toMatchSnapshot();
		} );

		it( 'should add additional child elements to be rendered in the panel', () => {
			render(
				<Panel>
					<dfn>The Panel</dfn>
				</Panel>
			);

			const term = screen.getByRole( 'term' );
			expect( term ).toBeVisible();
			expect( term ).toHaveTextContent( 'The Panel' );
		} );

		it( 'should render both children and header when provided as props', () => {
			render(
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
