import { afterEach, describe, expect, it } from 'vitest';
import {
	registerBlockType,
	unregisterBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import { select } from '@wordpress/data';
import variations, { registerCanvasVariation } from '../variations';

declare global {
	interface Window {
		__experimentalEnableGridInteractivity?: boolean;
	}
}

const TEST_BLOCK = 'test/group';

function registerGroup( {
	isGridInteractivityEnabled,
}: {
	isGridInteractivityEnabled: boolean;
} ) {
	window.__experimentalEnableGridInteractivity = isGridInteractivityEnabled;
	registerBlockType( TEST_BLOCK, {
		apiVersion: 3,
		title: 'Test group',
		category: 'design',
		attributes: {
			align: { type: 'string' },
			layout: { type: 'object' },
		},
		variations,
		edit: () => null,
		save: () => null,
	} );
	registerCanvasVariation( TEST_BLOCK );
}

function getVariationNames() {
	return select( blocksStore )
		.getBlockVariations( TEST_BLOCK )
		?.map( ( { name } ) => name );
}

describe( 'Group variations', () => {
	afterEach( () => {
		delete window.__experimentalEnableGridInteractivity;
		if ( select( blocksStore ).getBlockType( TEST_BLOCK ) ) {
			unregisterBlockType( TEST_BLOCK );
		}
	} );

	// The flag changes after the module has loaded, as when a script sets it
	// late, so the variation has to be registered with the block.
	it( 'offers Canvas only with the grid interactivity experiment', () => {
		registerGroup( { isGridInteractivityEnabled: false } );
		expect( getVariationNames() ).not.toContain( 'group-canvas' );
		unregisterBlockType( TEST_BLOCK );

		registerGroup( { isGridInteractivityEnabled: true } );
		const canvas = select( blocksStore )
			.getBlockVariations( TEST_BLOCK )
			?.find( ( { name } ) => name === 'group-canvas' );
		expect( canvas?.title ).toBe( 'Canvas' );
		expect( canvas?.attributes ).toEqual( {
			align: 'full',
			layout: {
				type: 'grid',
				columnCount: 12,
				rowCount: 12,
				isManualPlacement: true,
			},
		} );
		expect( canvas?.example ).toHaveProperty( 'innerBlocks' );
	} );

	it( 'shows manual grids as Canvas and other grids as Grid', () => {
		registerGroup( { isGridInteractivityEnabled: true } );
		const { getActiveBlockVariation } = select( blocksStore );

		expect(
			getActiveBlockVariation( TEST_BLOCK, {
				layout: {
					type: 'grid',
					columnCount: 4,
					isManualPlacement: true,
				},
			} )?.name
		).toBe( 'group-canvas' );
		expect(
			getActiveBlockVariation( TEST_BLOCK, {
				layout: { type: 'grid', columnCount: 4 },
			} )?.name
		).toBe( 'group-grid' );
	} );
} );
