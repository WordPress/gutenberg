import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import grid, { hasFixedGridCells } from '../grid';

globalThis.wpVitest.mockMatchMedia();

const GridLayoutInspectorControls = grid.inspectorControls;
const PANEL_ID = 'test-panel';

function renderInspectorControls( props = {} ) {
	return render(
		<ToolsPanel label="Layout" resetAll={ vi.fn() } panelId={ PANEL_ID }>
			<GridLayoutInspectorControls
				clientId={ PANEL_ID }
				layout={ {} }
				onChange={ vi.fn() }
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
	it( 'should size rows by their content if the grid interactivity experiment is off', () => {
		const expected = `.my-container { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(1rem, auto)); }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: { columnCount: 3, rowCount: 2, isManualPlacement: true },
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
	it( 'should not output rows for a viewport column count if the grid interactivity experiment is off', () => {
		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: { columnCount: 3, rowCount: 2, isManualPlacement: true },
			viewportOverrides: { columnCount: 1 },
			style: {},
			blockName: 'test-block',
			hasBlockGapSupport: false,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe(
			'.my-container { grid-template-columns: repeat(1, minmax(0, 1fr)); }'
		);
	} );
	describe( 'with the grid interactivity experiment', () => {
		let originalExperiment;
		beforeEach( () => {
			originalExperiment = window.__experimentalEnableGridInteractivity;
			window.__experimentalEnableGridInteractivity = true;
		} );
		afterEach( () => {
			window.__experimentalEnableGridInteractivity = originalExperiment;
		} );

		it( 'should size the rows of auto placement grids by their content', () => {
			const expected = `.my-container { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(1rem, auto)); }`;

			const result = grid.getLayoutStyle( {
				selector: '.my-container',
				layout: { columnCount: 3, rowCount: 2 },
				style: {},
				blockName: 'test-block',
				hasBlockGapSupport: false,
				layoutDefinitions: undefined,
			} );

			expect( result ).toBe( expected );
		} );
		it( 'should size manual placement grids by their width and tell their children the cells are fixed', () => {
			const expected =
				`.my-container { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(1rem, 1fr)); grid-auto-rows: minmax(1rem, 1fr); aspect-ratio: 3 / 2; min-height: 0; --wp--style--grid-cells: fixed; }` +
				`:where(.my-container .is-layout-grid) { --wp--style--grid-cells: auto; }`;

			const result = grid.getLayoutStyle( {
				selector: '.my-container',
				layout: {
					columnCount: 3,
					rowCount: 2,
					isManualPlacement: true,
				},
				style: {},
				blockName: 'test-block',
				hasBlockGapSupport: false,
				layoutDefinitions: undefined,
			} );

			expect( result ).toBe( expected );
		} );
		it( 'should update the aspect ratio of manual placement grids when a viewport changes the column count', () => {
			const result = grid.getLayoutStyle( {
				selector: '.my-container',
				layout: {
					columnCount: 3,
					rowCount: 2,
					isManualPlacement: true,
				},
				viewportOverrides: { columnCount: 1 },
				style: {},
				blockName: 'test-block',
				hasBlockGapSupport: false,
				layoutDefinitions: undefined,
			} );

			expect( result ).toContain(
				'aspect-ratio: 1 / 2; min-height: 0; --wp--style--grid-cells: fixed;'
			);
			// Nested grids are reset once, by the grid's own styles.
			expect( result ).not.toContain( ':where(' );
		} );
		it( 'should not output rows for a viewport column count of auto placement grids', () => {
			const result = grid.getLayoutStyle( {
				selector: '.my-container',
				layout: { columnCount: 3, rowCount: 2 },
				viewportOverrides: { columnCount: 1 },
				style: {},
				blockName: 'test-block',
				hasBlockGapSupport: false,
				layoutDefinitions: undefined,
			} );

			expect( result ).toBe(
				'.my-container { grid-template-columns: repeat(1, minmax(0, 1fr)); }'
			);
		} );
		it( 'should give rows the same height but not size manual placement grids by their width if they have a minimum column width', () => {
			const result = grid.getLayoutStyle( {
				selector: '.my-container',
				layout: {
					columnCount: 3,
					rowCount: 2,
					minimumColumnWidth: '12rem',
					isManualPlacement: true,
				},
				style: {},
				blockName: 'test-block',
				hasBlockGapSupport: false,
				layoutDefinitions: undefined,
			} );

			expect( result ).toContain(
				'grid-template-rows: repeat(2, minmax(1rem, 1fr)); grid-auto-rows: minmax(1rem, 1fr);'
			);
			expect( result ).not.toContain( 'aspect-ratio' );
			expect( result ).not.toContain( '--wp--style--grid-cells: fixed' );
			// A grid nested inside it still describes its own cells.
			expect( result ).toContain(
				':where(.my-container .is-layout-grid) { --wp--style--grid-cells: auto; }'
			);
		} );
		it( 'should stop sizing manual placement grids by their width when a viewport adds a minimum column width', () => {
			const result = grid.getLayoutStyle( {
				selector: '.my-container',
				layout: {
					columnCount: 3,
					rowCount: 2,
					isManualPlacement: true,
				},
				viewportOverrides: { minimumColumnWidth: '12rem' },
				style: {},
				blockName: 'test-block',
				hasBlockGapSupport: false,
				layoutDefinitions: undefined,
			} );

			expect( result ).toContain(
				'grid-auto-rows: minmax(1rem, 1fr); aspect-ratio: auto; min-height: auto; --wp--style--grid-cells: auto;'
			);
		} );
		it( 'should not tell the children of auto placement grids anything about their cells', () => {
			const result = grid.getLayoutStyle( {
				selector: '.my-container',
				layout: { columnCount: 3, rowCount: 2 },
				style: {},
				blockName: 'test-block',
				hasBlockGapSupport: false,
				layoutDefinitions: undefined,
			} );

			expect( result ).not.toContain( '--wp--style--grid-cells' );
		} );
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
	it( 'should use the horizontal block gap to calculate responsive Grid column widths', () => {
		const expected = `.my-container { grid-template-columns: repeat(auto-fill, minmax(max(min( 12rem, 100%), ( 100% - (3rem*2) ) / 3), 1fr)); container-type: inline-size; }.my-container { gap: 2rem 3rem; }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: { minimumColumnWidth: '12rem', columnCount: 3 },
			style: {
				spacing: { blockGap: { top: '2rem', left: '3rem' } },
			},
			blockName: 'test-block',
			hasBlockGapSupport: true,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
	it( 'should use the fallback gap when an axial value has no horizontal gap', () => {
		const expected = `.my-container { grid-template-columns: repeat(auto-fill, minmax(max(min( 12rem, 100%), ( 100% - (1.2rem*2) ) / 3), 1fr)); container-type: inline-size; }.my-container { gap: 2rem 1.2rem; }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: { minimumColumnWidth: '12rem', columnCount: 3 },
			style: { spacing: { blockGap: { top: '2rem' } } },
			blockName: 'test-block',
			hasBlockGapSupport: true,
			layoutDefinitions: undefined,
		} );

		expect( result ).toBe( expected );
	} );
	it( 'should preserve a zero horizontal gap in responsive Grid column widths', () => {
		const expected = `.my-container { grid-template-columns: repeat(auto-fill, minmax(max(min( 12rem, 100%), ( 100% - (0px*2) ) / 3), 1fr)); container-type: inline-size; }.my-container { gap: 2rem 0; }`;

		const result = grid.getLayoutStyle( {
			selector: '.my-container',
			layout: { minimumColumnWidth: '12rem', columnCount: 3 },
			style: {
				spacing: { blockGap: { top: '2rem', left: '0' } },
			},
			blockName: 'test-block',
			hasBlockGapSupport: true,
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

describe( 'hasFixedGridCells', () => {
	let originalExperiment;
	beforeEach( () => {
		originalExperiment = window.__experimentalEnableGridInteractivity;
		window.__experimentalEnableGridInteractivity = true;
	} );
	afterEach( () => {
		window.__experimentalEnableGridInteractivity = originalExperiment;
	} );

	const manualLayout = {
		type: 'grid',
		columnCount: 3,
		rowCount: 2,
		isManualPlacement: true,
	};

	it( 'is true for manual placement grids sized by their width', () => {
		expect( hasFixedGridCells( manualLayout ) ).toBe( true );
	} );

	it( 'is false for auto placement grids, grids with a minimum column width, and grids without both counts', () => {
		expect(
			hasFixedGridCells( { ...manualLayout, isManualPlacement: false } )
		).toBe( false );
		expect(
			hasFixedGridCells( {
				...manualLayout,
				minimumColumnWidth: '12rem',
			} )
		).toBe( false );
		expect(
			hasFixedGridCells( { ...manualLayout, rowCount: undefined } )
		).toBe( false );
	} );

	it( 'is false with the grid interactivity experiment off', () => {
		window.__experimentalEnableGridInteractivity = false;
		expect( hasFixedGridCells( manualLayout ) ).toBe( false );
	} );
} );
