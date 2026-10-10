import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { __experimentalToolsPanel as ToolsPanel } from '@wordpress/components';
import grid from '../grid';

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
		it( 'should size manual placement grids by their width and make images cover their cells', () => {
			const expected =
				`.my-container { grid-template-columns: repeat(3, minmax(0, 1fr)); grid-template-rows: repeat(2, minmax(1rem, 1fr)); grid-auto-rows: minmax(1rem, 1fr); aspect-ratio: 3 / 2; min-height: 0; }` +
				`.my-container > .wp-block-image { display: flex; flex-direction: column; }` +
				`.my-container > .wp-block-image > :is(img, a) { flex: 1 1 0; min-height: 0; }` +
				`.my-container > .wp-block-image > img,.my-container > .wp-block-image > a > img { width: 100%; height: 100%; object-fit: cover; }`;

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

			expect( result ).toContain( 'aspect-ratio: 1 / 2' );
			// Images cover their cells again, in case a wider viewport's
			// override stopped them.
			expect( result ).toContain(
				'.my-container > .wp-block-image > img,.my-container > .wp-block-image > a > img { width: 100%; height: 100%; object-fit: cover; }'
			);
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
			expect( result ).not.toContain( '.wp-block-image' );
		} );
		it( 'should leave images alone when a viewport changes the column count of manual placement grids with a minimum column width', () => {
			const result = grid.getLayoutStyle( {
				selector: '.my-container',
				layout: {
					columnCount: 3,
					rowCount: 2,
					minimumColumnWidth: '12rem',
					isManualPlacement: true,
				},
				viewportOverrides: { columnCount: 1 },
				style: {},
				blockName: 'test-block',
				hasBlockGapSupport: false,
				layoutDefinitions: undefined,
			} );

			expect( result ).not.toContain( 'aspect-ratio' );
			expect( result ).not.toContain( '.wp-block-image' );
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
				'grid-auto-rows: minmax(1rem, 1fr); aspect-ratio: auto; min-height: auto;'
			);
			expect( result ).toContain(
				'.my-container > .wp-block-image { display: block; }' +
					'.my-container > .wp-block-image > img,.my-container > .wp-block-image > a > img { width: auto; height: auto; }'
			);
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
