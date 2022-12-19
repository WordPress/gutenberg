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
const getPanelBodyContent = () => screen.queryByTestId( 'inner-content' );
const getPanelToggle = () => screen.getByRole( 'button', { name: 'Panel' } );

describe( 'PanelBody', () => {
	describe( 'basic rendering', () => {
		it( 'should render an empty div with the matching className', () => {
			const { container } = render( <PanelBody /> );
			const panelBody = getPanelBody( container );

			expect( panelBody ).toBeTruthy();
			expect( panelBody.tagName ).toBe( 'DIV' );
		} );

		it( 'should render inner content, if opened', () => {
			const { container } = render(
				<PanelBody opened={ true }>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);
			const panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();
		} );

		it( 'should be opened by default', () => {
			const { container } = render(
				<PanelBody>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);
			const panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();
		} );

		it( 'should render as initially opened, if specified', () => {
			const { container } = render(
				<PanelBody initialOpen={ true }>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);
			const panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();
		} );

		it( 'should call the children function, if specified', () => {
			const { container, rerender } = render(
				<PanelBody opened={ true }>
					{ ( { opened } ) => (
						<div hidden={ opened } data-testid="inner-content">
							Content
						</div>
					) }
				</PanelBody>
			);
			let panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();
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
			panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();
			expect( panelContent ).not.toHaveAttribute( 'hidden' );
		} );
	} );

	describe( 'toggling', () => {
		it( 'should toggle collapse with opened prop', () => {
			const { container, rerender } = render(
				<PanelBody opened={ true }>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);
			let panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();

			rerender(
				<PanelBody opened={ false }>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeFalsy();

			rerender(
				<PanelBody opened={ true }>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();
		} );

		it( 'should toggle when clicking header', () => {
			const { container } = render(
				<PanelBody title="Panel" initialOpen={ false }>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);
			let panelContent = getPanelBodyContent( container );
			const panelToggle = getPanelToggle( container );

			expect( panelContent ).toBeFalsy();

			fireEvent.click( panelToggle );

			panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();

			fireEvent.click( panelToggle );

			panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeFalsy();
		} );

		it( 'should pass button props to panel title', () => {
			const mock = jest.fn();

			const { container } = render(
				<PanelBody title="Panel" buttonProps={ { onClick: mock } }>
					<div data-testid="inner-content">Content</div>
				</PanelBody>
			);

			const panelToggle = getPanelToggle( container );

			fireEvent.click( panelToggle );

			expect( mock ).toHaveBeenCalled();
		} );
	} );
} );
