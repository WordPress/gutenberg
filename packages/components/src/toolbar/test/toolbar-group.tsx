/**
 * External dependencies
 */
import { fireEvent, screen } from '@testing-library/react';
import { render } from '@ariakit/test/react';

/**
 * Internal dependencies
 */
import { ToolbarGroup } from '..';

/**
 * WordPress dependencies
 */
import { wordpress } from '@wordpress/icons';

function createContainer() {
	const container = document.createElement( 'div' );
	document.body.appendChild( container );
	return container;
}

describe( 'ToolbarGroup', () => {
	describe( 'basic rendering', () => {
		it( 'should render an empty node, when controls are not passed', async () => {
			const container = createContainer();
			await render( <ToolbarGroup />, { container } );

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'should render an empty node, when controls are empty', async () => {
			const container = createContainer();
			await render( <ToolbarGroup controls={ [] } />, { container } );

			expect( container ).toBeEmptyDOMElement();
		} );

		it( 'should render a list of controls with buttons', async () => {
			const clickHandler = ( event?: React.MouseEvent ) => event;

			const controls = [
				{
					icon: wordpress,
					title: 'WordPress',
					onClick: clickHandler,
					isActive: false,
				},
			];

			await render( <ToolbarGroup controls={ controls } /> );

			const toolbarButton = screen.getByLabelText( 'WordPress' );
			expect( toolbarButton ).toHaveAttribute( 'aria-pressed', 'false' );
			expect( toolbarButton ).toHaveAttribute( 'type', 'button' );
		} );

		it( 'should render a list of controls with buttons and active control', async () => {
			const clickHandler = ( event?: React.MouseEvent ) => event;
			const controls = [
				{
					icon: wordpress,
					title: 'WordPress',
					onClick: clickHandler,
					isActive: true,
				},
			];

			await render( <ToolbarGroup controls={ controls } /> );

			const toolbarButton = screen.getByLabelText( 'WordPress' );
			expect( toolbarButton ).toHaveAttribute( 'aria-pressed', 'true' );
			expect( toolbarButton ).toHaveAttribute( 'type', 'button' );
		} );

		it( 'should render a nested list of controls with separator between', async () => {
			const controls = [
				[
					// First set.
					{
						icon: wordpress,
						title: 'WordPress',
					},
				],
				[
					// Second set.
					{
						icon: wordpress,
						title: 'WordPress',
					},
				],
			];

			await render( <ToolbarGroup controls={ controls } /> );

			const buttons = screen.getAllByRole( 'button' );

			expect( buttons ).toHaveLength( 2 );
			// eslint-disable-next-line testing-library/no-node-access
			expect( buttons[ 0 ].parentElement ).not.toHaveClass(
				'has-left-divider'
			);
			// eslint-disable-next-line testing-library/no-node-access
			expect( buttons[ 1 ].parentElement ).toHaveClass(
				'has-left-divider'
			);
		} );

		it( 'should call the clickHandler on click.', async () => {
			const clickHandler = jest.fn();
			const controls = [
				{
					icon: wordpress,
					title: 'WordPress',
					onClick: clickHandler,
					isActive: true,
				},
			];
			await render( <ToolbarGroup controls={ controls } /> );

			fireEvent.click( screen.getByLabelText( 'WordPress' ) );
			expect( clickHandler ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
