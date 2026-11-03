import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
} from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
	createBlock,
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import type { Block } from '@wordpress/blocks';
import type { DataRegistry } from '@wordpress/data';
import type { ReactNode } from 'react';
import { store as blockEditorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import { useUpdateGridChildLayout } from '../use-update-grid-child-layout';

describe( 'useUpdateGridChildLayout()', () => {
	let registry: DataRegistry;
	let grid: Block;
	let item: Block;
	let originalExperiment: boolean | undefined;

	beforeAll( () => {
		// @ts-expect-error The test blocks need no category.
		registerBlockType( 'test/grid', {
			apiVersion: 3,
			title: 'Test grid',
			attributes: {
				layout: { type: 'object' },
				style: { type: 'object' },
			},
			save: () => null,
		} );
		// @ts-expect-error The test blocks need no category.
		registerBlockType( 'test/item', {
			apiVersion: 3,
			title: 'Test item',
			attributes: { style: { type: 'object' } },
			save: () => null,
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( { name } ) => unregisterBlockType( name ) );
	} );

	beforeEach( () => {
		originalExperiment = window.__experimentalEnableGridInteractivity;
		window.__experimentalEnableGridInteractivity = true;
		registry = createRegistry();
		registry.register( blockEditorStore );
		registry.register( noticesStore );
		item = createBlock( 'test/item', {
			style: { layout: { columnStart: 1, rowStart: 1 } },
		} );
		grid = createBlock(
			'test/grid',
			{
				layout: {
					type: 'grid',
					isManualPlacement: true,
					columnCount: 2,
					stackOnMobile: true,
				},
			},
			[ item ]
		);
		registry.dispatch( blockEditorStore ).resetBlocks( [ grid ] );
	} );

	afterEach( () => {
		window.__experimentalEnableGridInteractivity = originalExperiment;
	} );

	function updateItem() {
		const { result } = renderHook( () => useUpdateGridChildLayout(), {
			wrapper: ( { children }: { children: ReactNode } ) => (
				<RegistryProvider value={ registry }>
					{ children }
				</RegistryProvider>
			),
		} );
		act( () => {
			result.current( item.clientId, { columnSpan: 1 } );
		} );
	}

	function getNoticeContents() {
		return registry
			.select( noticesStore )
			.getNotices()
			.map( ( { content } ) => content );
	}

	it( 'says so when an edit on mobile turns stacking off', () => {
		unlock( registry.dispatch( blockEditorStore ) ).setStyleStateViewport(
			'@mobile'
		);
		updateItem();
		expect( getNoticeContents() ).toEqual( [
			'Stack on mobile turned off for this grid.',
		] );
	} );

	it( 'says nothing when an edit leaves stacking as it is', () => {
		updateItem();
		expect( getNoticeContents() ).toEqual( [] );
	} );
} );
