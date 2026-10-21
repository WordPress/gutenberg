import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	registerBlockType,
	unregisterBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import { select } from '@wordpress/data';

const TEST_BLOCK = 'test/group';

async function getVariations( { isGridInteractivityEnabled } ) {
	vi.resetModules();
	window.__experimentalEnableGridInteractivity = isGridInteractivityEnabled;
	const { default: variations } = await import( '../variations' );
	return variations;
}

describe( 'Group variations', () => {
	afterEach( () => {
		delete window.__experimentalEnableGridInteractivity;
		if ( select( blocksStore ).getBlockType( TEST_BLOCK ) ) {
			unregisterBlockType( TEST_BLOCK );
		}
	} );

	it( 'offers Canvas only with the grid interactivity experiment', async () => {
		const withoutExperiment = await getVariations( {
			isGridInteractivityEnabled: false,
		} );
		expect( withoutExperiment.map( ( { name } ) => name ) ).not.toContain(
			'group-canvas'
		);

		const withExperiment = await getVariations( {
			isGridInteractivityEnabled: true,
		} );
		const canvas = withExperiment.find(
			( { name } ) => name === 'group-canvas'
		);
		expect( canvas.title ).toBe( 'Canvas' );
		expect( canvas.attributes ).toEqual( {
			align: 'full',
			layout: {
				type: 'grid',
				columnCount: 32,
				rowCount: 32,
				isManualPlacement: true,
			},
		} );
	} );

	it( 'shows manual grids as Canvas and other grids as Grid', async () => {
		const variations = await getVariations( {
			isGridInteractivityEnabled: true,
		} );
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
