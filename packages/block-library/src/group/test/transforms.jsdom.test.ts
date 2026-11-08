import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
	createBlock,
	registerBlockType,
	switchToBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { BlockConfiguration } from '@wordpress/blocks';

const BLOCK_NAME = 'core/group';
const experimentalWindow = window as Window & {
	__experimentalEnableGridInteractivity?: boolean;
};

describe( 'transforms', () => {
	let wasGridInteractivityEnabled: boolean | undefined;

	beforeAll( async () => {
		wasGridInteractivityEnabled =
			experimentalWindow.__experimentalEnableGridInteractivity;
		experimentalWindow.__experimentalEnableGridInteractivity = true;
		const { default: transforms } = await vi.importActual< {
			default: BlockConfiguration[ 'transforms' ];
		} >( '../transforms' );
		registerBlockType(
			{
				apiVersion: 3,
				name: BLOCK_NAME,
				title: 'Group',
				category: 'design',
				attributes: {
					layout: { type: 'object' },
				},
			},
			{ transforms }
		);
	} );

	afterAll( () => {
		unregisterBlockType( BLOCK_NAME );
		experimentalWindow.__experimentalEnableGridInteractivity =
			wasGridInteractivityEnabled;
	} );

	it( 'preserves Grid sizing when transforming Grid to Canvas', () => {
		const block = createBlock( BLOCK_NAME, {
			layout: {
				type: 'grid',
				columnCount: 4,
				minimumColumnWidth: '10rem',
			},
		} );

		const transformedBlocks = switchToBlockType(
			block,
			BLOCK_NAME,
			'group-canvas'
		);

		expect( transformedBlocks ).not.toBeNull();
		expect( transformedBlocks?.[ 0 ]?.attributes.layout ).toEqual( {
			type: 'grid',
			isManualPlacement: true,
			columnCount: 4,
			rowCount: 3,
			minimumColumnWidth: '10rem',
		} );
	} );

	it( 'preserves Canvas sizing when transforming Canvas to Grid', () => {
		const block = createBlock( BLOCK_NAME, {
			layout: {
				type: 'grid',
				isManualPlacement: true,
				columnCount: 4,
				rowCount: 5,
				minimumColumnWidth: '10rem',
			},
		} );

		const transformedBlocks = switchToBlockType(
			block,
			BLOCK_NAME,
			'group-grid'
		);

		expect( transformedBlocks ).not.toBeNull();
		expect( transformedBlocks?.[ 0 ]?.attributes.layout ).toEqual( {
			type: 'grid',
			columnCount: 4,
			minimumColumnWidth: '10rem',
		} );
	} );
} );
