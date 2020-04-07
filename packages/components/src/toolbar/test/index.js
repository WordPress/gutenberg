/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Toolbar from '../';
import ToolbarButton from '../../toolbar-button';

describe( 'Toolbar', () => {
	describe( 'basic rendering', () => {
		it( 'should render a toolbar with toolbar buttons', () => {
			const { getByLabelText } = render(
				<Toolbar __experimentalAccessibilityLabel="blocks">
					<ToolbarButton label="control1" />
					<ToolbarButton label="control2" />
				</Toolbar>
			);

			expect(
				getByLabelText( 'control1', { selector: 'button' } )
			).toBeInTheDocument();
			expect(
				getByLabelText( 'control2', { selector: 'button' } )
			).toBeInTheDocument();
		} );
	} );

	describe( 'ToolbarGroup', () => {
		it( 'should render an empty node, when controls are not passed', () => {
			const { container } = render( <Toolbar /> );

			expect( container.innerHTML ).toBe( '' );
		} );

		it( 'should render an empty node, when controls are empty', () => {
			const { container } = render( <Toolbar controls={ [] } /> );

			expect( container.innerHTML ).toBe( '' );
		} );

		it( 'should render a list of controls with buttons', () => {
			const controls = [
				{
					icon: 'wordpress',
					title: 'WordPress',
					subscript: 'wp',
					onClick: () => {},
					isActive: false,
				},
			];
			const { getByLabelText } = render(
				<Toolbar controls={ controls } />
			);

			const toolbarButton = getByLabelText( 'WordPress' );
			expect( toolbarButton ).toHaveAttribute(
				'aria-label',
				'WordPress'
			);
			expect( toolbarButton ).toHaveAttribute( 'aria-pressed', 'false' );
			expect( toolbarButton ).toHaveAttribute( 'data-subscript', 'wp' );
			expect( toolbarButton ).toHaveAttribute( 'type', 'button' );
		} );
	} );
} );
