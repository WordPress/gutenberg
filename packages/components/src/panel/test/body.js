/**
 * External dependencies
 */
import { render, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { PanelBody } from '../body';

const getPanelBody = ( container ) =>
	container.querySelector( '.components-panel__body' );
const getPanelBodyContent = ( container ) =>
	container.querySelector( '.components-panel__body > div' );
const getPanelToggle = ( container ) =>
	container.querySelector( '.components-panel__body-toggle' );

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
					<div className="inner-content">Content</div>
				</PanelBody>
			);
			const panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();
		} );

		it( 'should be opened by default', () => {
			const { container } = render(
				<PanelBody>
					<div>Content</div>
				</PanelBody>
			);
			const panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();
		} );

		it( 'should render as initially opened, if specified', () => {
			const { container } = render(
				<PanelBody initialOpen={ true }>
					<div>Content</div>
				</PanelBody>
			);
			const panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();
		} );

		it( 'should call the children function, if specified', () => {
			const { container, rerender } = render(
				<PanelBody opened={ true }>
					{ ( { opened } ) => <div hidden={ opened }>Content</div> }
				</PanelBody>
			);
			let panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();
			expect( panelContent.getAttribute( 'hidden' ) ).toBe( '' );

			rerender(
				<PanelBody opened={ false }>
					{ ( { opened } ) => <div hidden={ opened }>Content</div> }
				</PanelBody>
			);
			panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();
			expect( panelContent.getAttribute( 'hidden' ) ).toBeNull();
		} );
	} );

	describe( 'toggling', () => {
		it( 'should toggle collapse with opened prop', () => {
			const { container, rerender } = render(
				<PanelBody opened={ true }>
					<div>Content</div>
				</PanelBody>
			);
			let panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();

			rerender(
				<PanelBody opened={ false }>
					<div>Content</div>
				</PanelBody>
			);

			panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeFalsy();

			rerender(
				<PanelBody opened={ true }>
					<div>Content</div>
				</PanelBody>
			);

			panelContent = getPanelBodyContent( container );

			expect( panelContent ).toBeTruthy();
		} );

		it( 'should toggle when clicking header', () => {
			const { container } = render(
				<PanelBody title="Panel" initialOpen={ false }>
					<div>Content</div>
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
					<div>Content</div>
				</PanelBody>
			);

			const panelToggle = getPanelToggle( container );

			fireEvent.click( panelToggle );

			expect( mock ).toHaveBeenCalled();
		} );
	} );
} );
