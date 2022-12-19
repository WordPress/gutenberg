/**
 * External dependencies
 */
import { render, fireEvent, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { PanelBody } from '../body';

const getPanelBody = ( container ) =>
	// There currently isn't an accessible way to retrieve the panel body wrapper.
	// eslint-disable-next-line testing-library/no-node-access
	container.querySelector( '.components-panel__body' );

describe( 'PanelBody', () => {
	describe( 'basic rendering', () => {
		it( 'should render an empty div with the matching className', () => {
			const { container } = render( <PanelBody /> );
			const panelBody = getPanelBody( container );

			expect( panelBody ).toBeVisible();
			expect( panelBody.tagName ).toBe( 'DIV' );
		} );

		it( 'should render inner content, if opened', () => {
			render(
				<PanelBody opened>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);
			const panelContent = screen.queryByTestId( 'inner-content' );

			expect( panelContent ).toBeVisible();
		} );

		it( 'should be opened by default', () => {
			render(
				<PanelBody>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);
			const panelContent = screen.queryByTestId( 'inner-content' );

			expect( panelContent ).toBeVisible();
		} );

		it( 'should render as initially opened, if specified', () => {
			render(
				<PanelBody initialOpen>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);
			const panelContent = screen.queryByTestId( 'inner-content' );

			expect( panelContent ).toBeVisible();
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
			let panelContent = screen.queryByTestId( 'inner-content' );

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
			panelContent = screen.queryByTestId( 'inner-content' );

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
			let panelContent = screen.queryByTestId( 'inner-content' );

			expect( panelContent ).toBeVisible();

			rerender(
				<PanelBody opened={ false }>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			panelContent = screen.queryByTestId( 'inner-content' );

			expect( panelContent ).not.toBeInTheDocument();

			rerender(
				<PanelBody opened>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			panelContent = screen.queryByTestId( 'inner-content' );

			expect( panelContent ).toBeVisible();
		} );

		it( 'should toggle when clicking header', () => {
			render(
				<PanelBody title="Panel" initialOpen={ false }>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);
			let panelContent = screen.queryByTestId( 'inner-content' );
			const panelToggle = screen.getByRole( 'button', { name: 'Panel' } );

			expect( panelContent ).not.toBeInTheDocument();

			fireEvent.click( panelToggle );

			panelContent = screen.queryByTestId( 'inner-content' );

			expect( panelContent ).toBeVisible();

			fireEvent.click( panelToggle );

			panelContent = screen.queryByTestId( 'inner-content' );

			expect( panelContent ).not.toBeInTheDocument();
		} );

		it( 'should pass button props to panel title', () => {
			const mock = jest.fn();

			render(
				<PanelBody title="Panel" buttonProps={ { onClick: mock } }>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			const panelToggle = screen.getByRole( 'button', { name: 'Panel' } );

			fireEvent.click( panelToggle );

			expect( mock ).toHaveBeenCalled();
		} );
	} );
} );
