/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import PanelHeader from '../header';

describe( 'PanelHeader', () => {
	describe( 'basic rendering', () => {
		it( 'should render PanelHeader with empty div inside', () => {
			const { container } = render( <PanelHeader /> );

			expect( container ).toMatchSnapshot();
		} );

		it( 'should render a label matching the text provided in the prop', () => {
			render( <PanelHeader label="Some Label" /> );

			const heading = screen.getByRole( 'heading' );
			expect( heading ).toBeVisible();
			expect( heading ).toHaveTextContent( 'Some Label' );
		} );

		it( 'should render child elements in the panel header body when provided', () => {
			render(
				<PanelHeader>
					<dfn>Some text</dfn>
				</PanelHeader>
			);

			const term = screen.getByRole( 'term' );
			expect( term ).toBeVisible();
			expect( term ).toHaveTextContent( 'Some text' );
		} );

		it( 'should render both child elements and label when passed in', () => {
			render(
				<PanelHeader label="Some Label">
					<dfn>Some text</dfn>
				</PanelHeader>
			);

			const heading = screen.getByRole( 'heading' );
			expect( heading ).toBeVisible();
			expect( heading ).toHaveTextContent( 'Some Label' );

			const term = screen.getByRole( 'term' );
			expect( term ).toBeVisible();
			expect( term ).toHaveTextContent( 'Some text' );
		} );
	} );
} );
