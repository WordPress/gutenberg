/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';

/**
 * Internal dependencies
 */
import grid from '../grid';

const GridLayoutInspectorControls = grid.inspectorControls;
const PANEL_ID = 'test-panel';

function renderInspectorControls( props = {} ) {
	return render(
		<ToolsPanel label="Layout" resetAll={ jest.fn() } panelId={ PANEL_ID }>
			<GridLayoutInspectorControls
				clientId={ PANEL_ID }
				layout={ {} }
				onChange={ jest.fn() }
				{ ...props }
			/>
		</ToolsPanel>
	);
}

describe( 'getLayoutStyle', () => {
	it( 'should return only `grid-template-columns` and `container-type` properties if no non-default params are provided', () => {
		const expected = `.my-container { grid-template-columns: repeat(auto-fill, minmax(min(12rem, 100%), 1fr)); container-type: inline-size; }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: {},
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
	it( 'should return only `grid-template-columns` if columnCount property is provided', () => {
		const expected = `.my-container { grid-template-columns: repeat(3, minmax(0, 1fr)); }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: { columnCount: 3 },
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
	it( 'should return `grid-template-columns` with max() function if both minimumColumnWidth and columnCount are provided', () => {
		const expected = `.my-container { grid-template-columns: repeat(auto-fill, minmax(max(min( 12rem, 100%), ( 100% - (1.2rem*2) ) / 3), 1fr)); container-type: inline-size; }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: { minimumColumnWidth: '12rem', columnCount: 3 },
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
	it( 'should use `auto-fit` instead of `auto-fill` when autoFit is enabled', () => {
		const expected = `.my-container { grid-template-columns: repeat(auto-fit, minmax(min(12rem, 100%), 1fr)); container-type: inline-size; }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: { autoFit: true },
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
	it( 'should use `auto-fit` with max() function when autoFit is enabled and both minimumColumnWidth and columnCount are provided', () => {
		const expected = `.my-container { grid-template-columns: repeat(auto-fit, minmax(max(min( 12rem, 100%), ( 100% - (1.2rem*2) ) / 3), 1fr)); container-type: inline-size; }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: {
				minimumColumnWidth: '12rem',
				columnCount: 3,
				autoFit: true,
			},
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
} );

describe( 'GridLayoutInspectorControls', () => {
	it( 'renders an unset column count as an empty control value', () => {
		renderInspectorControls( {
			layout: { type: 'grid', columnCount: null },
			resetLayout: { type: 'grid', columnCount: 3 },
		} );

		expect(
			screen.getByRole( 'spinbutton', { name: 'Columns' } )
		).toHaveDisplayValue( '' );
	} );
} );
