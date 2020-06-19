/**
 * External dependencies
 */
import { act, render, fireEvent } from '@testing-library/react';

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

		it( 'should render inner content', () => {
			const { container } = render(
				<PanelBody>
					<div className="inner-content">Content</div>
				</PanelBody>
			);
			const panelContent = getPanelBodyContent( container );
			const content = panelContent.querySelector( '.inner-content' );

			expect( content ).toBeTruthy();
		} );

		it( 'should be collapsed by default', () => {
			const { container } = render(
				<PanelBody>
					<div>Content</div>
				</PanelBody>
			);
			const panelContent = getPanelBodyContent( container );

			expect( panelContent.style.display ).toBe( 'none' );
		} );

		it( 'should render as initially opened, if specified', () => {
			const { container } = render(
				<PanelBody initialOpen={ true }>
					<div>Content</div>
				</PanelBody>
			);
			const panelContent = getPanelBodyContent( container );

			expect( panelContent.style.display ).not.toBe( 'none' );
		} );
	} );

	describe( 'toggling', () => {
		it( 'should toggle collapse with opened prop', () => {
			const { container, rerender } = render(
				<PanelBody opened={ true }>
					<div>Content</div>
				</PanelBody>
			);
			const panelContent = getPanelBodyContent( container );

			expect( panelContent.style.display ).not.toBe( 'none' );

			act( () => {
				rerender(
					<PanelBody opened={ false }>
						<div>Content</div>
					</PanelBody>
				);
			} );

			expect( panelContent.style.display ).toBe( 'none' );

			act( () => {
				rerender(
					<PanelBody opened={ true }>
						<div>Content</div>
					</PanelBody>
				);
			} );

			expect( panelContent.style.display ).not.toBe( 'none' );
		} );

		it( 'should toggle when clicking header', () => {
			const { container } = render(
				<PanelBody opened={ false } title="Panel">
					<div>Content</div>
				</PanelBody>
			);
			const panelContent = getPanelBodyContent( container );
			const panelToggle = getPanelToggle( container );

			expect( panelContent.style.display ).toBe( 'none' );

			act( () => {
				fireEvent.click( panelToggle );
			} );

			expect( panelContent.style.display ).not.toBe( 'none' );

			act( () => {
				fireEvent.click( panelToggle );
			} );

			expect( panelContent.style.display ).toBe( 'none' );
		} );
	} );
} );
