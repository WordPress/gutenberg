/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * Internal dependencies
 */
import { PanelBody } from '../body';

describe( 'PanelBody', () => {
	describe( 'basic rendering', () => {
		it( 'should render an empty div with the matching className', () => {
			const { container } = render( <PanelBody /> );

			expect( container ).toMatchSnapshot();
		} );

		it( 'should render inner content, if opened', () => {
			render(
				<PanelBody opened>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			expect( screen.getByTestId( 'inner-content' ) ).toBeVisible();
		} );

		it( 'should be opened by default', () => {
			render(
				<PanelBody>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			expect( screen.getByTestId( 'inner-content' ) ).toBeVisible();
		} );

		it( 'should render as initially opened, if specified', () => {
			render(
				<PanelBody initialOpen>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			expect( screen.getByTestId( 'inner-content' ) ).toBeVisible();
		} );

		it( 'should call the children function, if specified', () => {
			const { rerender } = render(
				<PanelBody opened>
					{ ( { opened } ) => (
						<div hidden={ opened } data-testid="inner-content">
							Content
						</div>
					) }
				</PanelBody>
			);

			let panelContent = screen.getByTestId( 'inner-content' );

			expect( panelContent ).toBeInTheDocument();
			expect( panelContent ).not.toBeVisible();
			expect( panelContent ).toHaveAttribute( 'hidden', '' );

			rerender(
				<PanelBody opened={ false }>
					{ ( { opened } ) => (
						<div hidden={ opened } data-testid="inner-content">
							Content
						</div>
					) }
				</PanelBody>
			);

			panelContent = screen.getByTestId( 'inner-content' );

			expect( panelContent ).toBeVisible();
			expect( panelContent ).not.toHaveAttribute( 'hidden' );
		} );
	} );

	describe( 'toggling', () => {
		it( 'should toggle collapse with opened prop', () => {
			const { rerender } = render(
				<PanelBody opened>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			expect( screen.getByTestId( 'inner-content' ) ).toBeVisible();

			rerender(
				<PanelBody opened={ false }>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			expect(
				screen.queryByTestId( 'inner-content' )
			).not.toBeInTheDocument();

			rerender(
				<PanelBody opened>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			expect( screen.getByTestId( 'inner-content' ) ).toBeVisible();
		} );

		it( 'should toggle when clicking header', async () => {
			const user = userEvent.setup();

			render(
				<PanelBody title="Panel" initialOpen={ false }>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			const panelToggle = screen.getByRole( 'button', { name: 'Panel' } );

			expect(
				screen.queryByTestId( 'inner-content' )
			).not.toBeInTheDocument();

			await user.click( panelToggle );

			expect( screen.getByTestId( 'inner-content' ) ).toBeVisible();

			await user.click( panelToggle );

			expect(
				screen.queryByTestId( 'inner-content' )
			).not.toBeInTheDocument();
		} );

		it( 'should pass button props to panel title', async () => {
			const user = userEvent.setup();
			const mock = jest.fn();

			render(
				<PanelBody title="Panel" buttonProps={ { onClick: mock } }>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			await user.click( screen.getByRole( 'button', { name: 'Panel' } ) );

			expect( mock ).toHaveBeenCalled();
		} );
	} );
} );
