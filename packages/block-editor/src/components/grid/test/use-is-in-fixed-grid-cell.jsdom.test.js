import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import { isInFixedGridCell } from '../use-is-in-fixed-grid-cell';

const MANUAL_GRID = {
	type: 'grid',
	columnCount: 3,
	rowCount: 2,
	isManualPlacement: true,
};

function setUp( { layout = MANUAL_GRID, style } = {} ) {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	registry.dispatch( blockEditorStore ).resetBlocks( [
		{
			clientId: 'grid',
			name: 'core/group',
			isValid: true,
			attributes: { layout, style },
			innerBlocks: [
				{
					clientId: 'image',
					name: 'core/image',
					isValid: true,
					attributes: {},
					innerBlocks: [],
				},
			],
		},
	] );
	return registry;
}

describe( 'isInFixedGridCell', () => {
	let originalExperiment;
	beforeEach( () => {
		originalExperiment = window.__experimentalEnableGridInteractivity;
		window.__experimentalEnableGridInteractivity = true;
	} );
	afterEach( () => {
		window.__experimentalEnableGridInteractivity = originalExperiment;
	} );

	it( 'is true for a block in a manual placement grid', () => {
		const registry = setUp();
		expect( isInFixedGridCell( registry.select, 'image' ) ).toBe( true );
	} );

	it( 'is false for a block that is not in a grid', () => {
		const registry = setUp();
		expect( isInFixedGridCell( registry.select, 'grid' ) ).toBe( false );
	} );

	it( 'is false with the grid interactivity experiment off', () => {
		window.__experimentalEnableGridInteractivity = false;
		const registry = setUp();
		expect( isInFixedGridCell( registry.select, 'image' ) ).toBe( false );
	} );

	it( 'is false in auto placement grids and grids with a minimum column width', () => {
		expect(
			isInFixedGridCell(
				setUp( {
					layout: { ...MANUAL_GRID, isManualPlacement: false },
				} ).select,
				'image'
			)
		).toBe( false );
		expect(
			isInFixedGridCell(
				setUp( {
					layout: { ...MANUAL_GRID, minimumColumnWidth: '12rem' },
				} ).select,
				'image'
			)
		).toBe( false );
	} );

	it( 'follows the layout of the viewport whose styles are edited', () => {
		const registry = setUp( {
			style: { '@tablet': { layout: { minimumColumnWidth: '12rem' } } },
		} );
		expect( isInFixedGridCell( registry.select, 'image' ) ).toBe( true );

		unlock( registry.dispatch( blockEditorStore ) ).setStyleStateViewport(
			'@tablet'
		);
		expect( isInFixedGridCell( registry.select, 'image' ) ).toBe( false );
	} );

	it( 'is false on mobile when the grid stacks its blocks', () => {
		const registry = setUp();
		unlock( registry.dispatch( blockEditorStore ) ).setStyleStateViewport(
			'@mobile'
		);
		expect( isInFixedGridCell( registry.select, 'image' ) ).toBe( false );

		const unstacked = setUp( {
			layout: { ...MANUAL_GRID, stackOnMobile: false },
		} );
		unlock( unstacked.dispatch( blockEditorStore ) ).setStyleStateViewport(
			'@mobile'
		);
		expect( isInFixedGridCell( unstacked.select, 'image' ) ).toBe( true );
	} );
} );
