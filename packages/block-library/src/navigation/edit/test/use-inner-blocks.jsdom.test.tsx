import type { ReactNode } from 'react';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useInnerBlocks } from '../use-inner-blocks';

type Registry = ReturnType< typeof createRegistry >;

const BLOCK_NAMES = [
	'core/navigation',
	'core/navigation-link',
	'core/page-list',
];

function setup( innerBlocks: Block[] = [] ) {
	const registry = createRegistry();
	registry.register( blockEditorStore );

	const navigationBlock = createBlock( 'core/navigation', {}, innerBlocks );
	registry.dispatch( blockEditorStore ).resetBlocks( [ navigationBlock ] );

	const { result } = renderHook(
		() => useInnerBlocks( navigationBlock.clientId ),
		{
			wrapper: ( { children }: { children: ReactNode } ) => (
				<RegistryProvider value={ registry }>
					{ children }
				</RegistryProvider>
			),
		}
	);

	return { registry, clientId: navigationBlock.clientId, result };
}

function controlInnerBlocks(
	registry: Registry,
	clientId: string,
	blocks: Block[]
) {
	const { setHasControlledInnerBlocks, replaceInnerBlocks } =
		registry.dispatch( blockEditorStore );
	act( () => {
		registry.batch( () => {
			setHasControlledInnerBlocks( clientId, true );
			replaceInnerBlocks( clientId, blocks );
		} );
	} );
}

describe( 'useInnerBlocks', () => {
	beforeAll( () => {
		BLOCK_NAMES.forEach( ( name ) =>
			registerBlockType( name, {
				apiVersion: 3,
				title: name,
				category: 'design',
				attributes: {},
				save: () => null,
			} )
		);
	} );

	afterAll( () => {
		BLOCK_NAMES.forEach( ( name ) => unregisterBlockType( name ) );
	} );

	it( 'returns no inner blocks for an empty Navigation block', () => {
		const { result } = setup();

		expect( result.current ).toMatchObject( {
			innerBlocks: [],
			hasUncontrolledInnerBlocks: false,
			uncontrolledInnerBlocks: [],
			controlledInnerBlocks: [],
		} );
	} );

	it( 'returns uncontrolled inner blocks', () => {
		const { result } = setup( [ createBlock( 'core/page-list' ) ] );

		expect( result.current ).toMatchObject( {
			innerBlocks: [ { name: 'core/page-list' } ],
			hasUncontrolledInnerBlocks: true,
			uncontrolledInnerBlocks: [ { name: 'core/page-list' } ],
			controlledInnerBlocks: [],
		} );
	} );

	it( 'returns controlled inner blocks once uncontrolled ones are replaced', () => {
		const { registry, clientId, result } = setup( [
			createBlock( 'core/page-list' ),
		] );

		controlInnerBlocks( registry, clientId, [
			createBlock( 'core/navigation-link' ),
		] );

		expect( result.current ).toMatchObject( {
			innerBlocks: [ { name: 'core/navigation-link' } ],
			hasUncontrolledInnerBlocks: false,
			uncontrolledInnerBlocks: [],
			controlledInnerBlocks: [ { name: 'core/navigation-link' } ],
		} );
	} );

	it( 'returns no inner blocks when controlled by an empty menu', () => {
		const { registry, clientId, result } = setup( [
			createBlock( 'core/page-list' ),
		] );

		controlInnerBlocks( registry, clientId, [] );

		expect( result.current ).toMatchObject( {
			innerBlocks: [],
			hasUncontrolledInnerBlocks: false,
			uncontrolledInnerBlocks: [],
			controlledInnerBlocks: [],
		} );
	} );

	it( 'ignores stale inner blocks on the tree entry of a controlled block', () => {
		const { registry, clientId, result } = setup();

		controlInnerBlocks( registry, clientId, [
			createBlock( 'core/navigation-link' ),
		] );

		// Replacing the root inner blocks with the same Navigation block,
		// carrying inner blocks of its own, keeps the controlled inner
		// blocks but leaves the given ones on the block's own tree entry.
		act( () => {
			registry.dispatch( blockEditorStore ).replaceInnerBlocks( '', [
				{
					...createBlock( 'core/navigation', {}, [
						createBlock( 'core/page-list' ),
					] ),
					clientId,
				},
			] );
		} );

		expect(
			registry.select( blockEditorStore ).getBlock( clientId )
		).toMatchObject( { innerBlocks: [ { name: 'core/page-list' } ] } );
		expect( result.current ).toMatchObject( {
			innerBlocks: [ { name: 'core/navigation-link' } ],
			hasUncontrolledInnerBlocks: false,
			uncontrolledInnerBlocks: [],
			controlledInnerBlocks: [ { name: 'core/navigation-link' } ],
		} );
	} );

	describe( 'isInnerBlockSelected', () => {
		it( 'is false when nothing is selected', () => {
			const { result } = setup( [ createBlock( 'core/page-list' ) ] );

			expect( result.current.isInnerBlockSelected ).toBe( false );
		} );

		it( 'is false when the Navigation block itself is selected', () => {
			const { registry, clientId, result } = setup( [
				createBlock( 'core/page-list' ),
			] );

			act( () => {
				registry.dispatch( blockEditorStore ).selectBlock( clientId );
			} );

			expect( result.current.isInnerBlockSelected ).toBe( false );
		} );

		it( 'is true when an uncontrolled inner block is selected', () => {
			const pageList = createBlock( 'core/page-list' );
			const { registry, result } = setup( [ pageList ] );

			act( () => {
				registry
					.dispatch( blockEditorStore )
					.selectBlock( pageList.clientId );
			} );

			expect( result.current.isInnerBlockSelected ).toBe( true );
		} );

		it( 'is true when a controlled inner block is selected', () => {
			const navigationLink = createBlock( 'core/navigation-link' );
			const { registry, clientId, result } = setup();

			controlInnerBlocks( registry, clientId, [ navigationLink ] );
			act( () => {
				registry
					.dispatch( blockEditorStore )
					.selectBlock( navigationLink.clientId );
			} );

			expect( result.current.isInnerBlockSelected ).toBe( true );
		} );
	} );
} );
