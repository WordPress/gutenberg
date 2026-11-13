import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
	createBlock,
	getBlockType,
	registerBlockType,
	store as blocksStore,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { createRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { filterSingleUseBlocks, preparePasteBlocks } from '../utils';
import { store as blockEditorStore } from '../../../store';

describe( 'filterSingleUseBlocks and preparePasteBlocks', () => {
	beforeAll( () => {
		// @ts-expect-error Test block does not require a category.
		registerBlockType( 'test/regular', {
			apiVersion: 3,
			title: 'Regular',
		} );
		// @ts-expect-error Test block does not require a category.
		registerBlockType( 'test/container', {
			apiVersion: 3,
			title: 'Container',
		} );
		// @ts-expect-error Test block does not require a category.
		registerBlockType( 'test/single-use', {
			apiVersion: 3,
			title: 'Single Use',
			supports: {
				multiple: false,
			},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/regular' );
		unregisterBlockType( 'test/container' );
		unregisterBlockType( 'test/single-use' );
	} );

	function createEditorRegistry( initialBlocks: Block[] = [] ) {
		const registry = createRegistry();
		registry.register( blocksStore );
		registry.register( blockEditorStore );
		registry.register( noticesStore );
		registry
			.dispatch( blocksStore )
			.addBlockTypes( [
				getBlockType( 'test/regular' )!,
				getBlockType( 'test/container' )!,
				getBlockType( 'test/single-use' )!,
			] );
		registry.dispatch( blockEditorStore ).resetBlocks( initialBlocks );
		return registry;
	}

	it( 'keeps regular blocks unchanged', () => {
		const existing = createBlock( 'test/single-use' );
		const registry = createEditorRegistry( [ existing ] );
		const incoming = [
			createBlock( 'test/regular' ),
			createBlock( 'test/container', {}, [
				createBlock( 'test/regular' ),
			] ),
		];

		const result = filterSingleUseBlocks( incoming, registry );
		expect( result.blocks ).toBe( incoming );
		expect( result.omittedBlockNames ).toEqual( [] );
	} );

	it( 'allows pasting a single-use block when none exists yet', () => {
		const registry = createEditorRegistry( [
			createBlock( 'test/regular' ),
		] );
		const singleUse = createBlock( 'test/single-use' );

		const allowed = preparePasteBlocks( [ singleUse ], registry );
		expect( allowed ).toEqual( [ singleUse ] );
		expect( registry.select( noticesStore ).getNotices() ).toEqual( [] );
	} );

	it( 'returns null and notifies when pasting an already-used single-use block', () => {
		const existing = createBlock( 'test/single-use' );
		const registry = createEditorRegistry( [ existing ] );
		const duplicate = createBlock( 'test/single-use' );

		const allowed = preparePasteBlocks( [ duplicate ], registry );
		expect( allowed ).toBeNull();
		expect( registry.select( noticesStore ).getNotices() ).toMatchObject( [
			{
				status: 'warning',
				content: '"Single Use" can only be used once.',
			},
		] );
	} );

	it( 'keeps other blocks while omitting already-used single-use blocks including nested ones', () => {
		const existing = createBlock( 'test/single-use' );
		const registry = createEditorRegistry( [ existing ] );
		const keptRegular = createBlock( 'test/regular' );
		const container = createBlock( 'test/container', {}, [
			keptRegular,
			createBlock( 'test/single-use' ),
		] );
		const trailingRegular = createBlock( 'test/regular' );

		const allowed = preparePasteBlocks(
			[ createBlock( 'test/single-use' ), container, trailingRegular ],
			registry
		);

		expect( allowed ).toHaveLength( 2 );
		expect( allowed![ 0 ].innerBlocks ).toEqual( [ keptRegular ] );
		expect( allowed![ 1 ] ).toBe( trailingRegular );
		expect( registry.select( noticesStore ).getNotices() ).toHaveLength(
			1
		);
	} );

	it( 'keeps only the first instance when two identical single-use blocks are pasted together', () => {
		const registry = createEditorRegistry();
		const first = createBlock( 'test/single-use' );
		const second = createBlock( 'test/single-use' );

		const allowed = preparePasteBlocks( [ first, second ], registry );
		expect( allowed ).toEqual( [ first ] );
		expect( registry.select( noticesStore ).getNotices() ).toMatchObject( [
			{
				status: 'warning',
				content: '"Single Use" can only be used once.',
			},
		] );
	} );

	it( 'allows replacing an existing single-use block or a container holding it', () => {
		const existing = createBlock( 'test/single-use' );
		const container = createBlock( 'test/container', {}, [ existing ] );
		const registry = createEditorRegistry( [ container ] );
		const replacement = createBlock( 'test/single-use' );

		const allowed = preparePasteBlocks( [ replacement ], registry, [
			container.clientId,
		] );
		expect( allowed ).toEqual( [ replacement ] );
		expect( registry.select( noticesStore ).getNotices() ).toEqual( [] );
	} );
} );
