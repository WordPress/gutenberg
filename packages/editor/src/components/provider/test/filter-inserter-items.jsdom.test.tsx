import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import type { DataRegistry } from '@wordpress/data';
import type { ReactNode } from 'react';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
	store as blocksStore,
} from '@wordpress/blocks';
import {
	BlockContextProvider,
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import useBlockTypesState from '../../../../../block-editor/src/components/inserter/hooks/use-block-types-state';
import filterInserterItems from '../filter-inserter-items';
import { unlock } from '../../../lock-unlock';

const { filterInserterItemsSelectKey } = unlock( blockEditorPrivateApis );
const TAXONOMIES = [
	{ slug: 'category', name: 'Categories', types: [ 'post' ] },
	{ slug: 'post_tag', name: 'Tags', types: [ 'post' ] },
	{ slug: 'recipe_cat', name: 'Recipe Categories', types: [ 'recipe' ] },
	{ slug: 'shared', name: 'Shared Terms', types: [ 'post', 'recipe' ] },
];
const BLOCK_NAMES = [
	'core/paragraph',
	'core/group',
	'core/query',
	'core/post-template',
	'core/post-terms',
	'test/post-context',
];

function createEditorRegistry(
	taxonomies: typeof TAXONOMIES | null = TAXONOMIES
) {
	const registry = createRegistry();
	registry.register( blocksStore );
	registry.register( coreStore );
	registry.register( blockEditorStore );
	unlock(
		registry.dispatch( blockEditorStore )
	).__experimentalUpdateSettings( {
		[ filterInserterItemsSelectKey ]: filterInserterItems,
	} );
	if ( taxonomies ) {
		registry
			.dispatch( coreStore )
			.receiveEntityRecords( 'root', 'taxonomy', taxonomies, {} );
		registry.dispatch( coreStore ).finishResolution( 'getTaxonomies', [] );
		expect( registry.select( coreStore ).getTaxonomies() ).toEqual(
			taxonomies
		);
	}
	return registry;
}

function renderInserter(
	registry: DataRegistry,
	context: Record< string, unknown > = {},
	rootClientId?: string,
	isQuick = false
) {
	return renderHook(
		( { root } ) => useBlockTypesState( root, () => {}, isQuick ),
		{
			initialProps: { root: rootClientId },
			wrapper: ( { children }: { children: ReactNode } ) => (
				<RegistryProvider value={ registry }>
					<BlockContextProvider value={ context }>
						{ children }
					</BlockContextProvider>
				</RegistryProvider>
			),
		}
	);
}

function terms( result: ReturnType< typeof renderInserter >[ 'result' ] ) {
	return result.current[ 0 ]
		.filter( ( item ) => item.name === 'core/post-terms' )
		.map( ( item ) => item.initialAttributes?.term );
}

function queryBlocks( postType: string, inherit = false ) {
	const content = createBlock( 'core/group', {}, [
		createBlock( 'core/paragraph' ),
	] );
	const template = createBlock( 'core/post-template', {}, [ content ] );
	return {
		query: createBlock( 'core/query', { query: { postType, inherit } }, [
			template,
		] ),
		root: content.clientId,
	};
}

describe( 'Post Terms insertion availability', () => {
	beforeEach( () => {
		for ( const name of BLOCK_NAMES ) {
			const attributes: Record< string, { type: 'object' | 'string' } > =
				{};
			const providesContext: Record< string, string > = {};
			if ( name === 'core/query' ) {
				attributes.query = { type: 'object' };
				providesContext.query = 'query';
			} else if ( name === 'core/post-terms' ) {
				attributes.term = { type: 'string' };
			} else if ( name === 'test/post-context' ) {
				attributes.entityType = { type: 'string' };
				providesContext.postType = 'entityType';
			}
			registerBlockType< Record< string, unknown > >( name, {
				apiVersion: 3,
				title: name,
				category: 'theme',
				attributes,
				providesContext,
				variations:
					name === 'core/post-terms'
						? TAXONOMIES.map( ( taxonomy ) => ( {
								name: taxonomy.slug,
								title: taxonomy.name,
								isDefault: taxonomy.slug === 'category',
								attributes: { term: taxonomy.slug },
								scope: [ 'inserter' ],
							} ) )
						: undefined,
				save: () => null,
			} );
		}
	} );

	afterEach( () => {
		for ( const name of BLOCK_NAMES ) {
			unregisterBlockType( name );
		}
	} );

	it.each( [ true, false ] )(
		'filters the shared insertion UI (quick: %s)',
		( isQuick ) => {
			const { result } = renderInserter(
				createEditorRegistry(),
				{ postType: 'post' },
				undefined,
				isQuick
			);
			expect( terms( result ) ).toEqual( [
				'category',
				'post_tag',
				'shared',
			] );
			expect(
				result.current[ 0 ].some(
					( item ) => item.name === 'core/paragraph'
				)
			).toBe( true );
		}
	);

	it( 'offers a recipe taxonomy only for the associated post type', () => {
		const { result } = renderInserter( createEditorRegistry(), {
			postType: 'recipe',
		} );
		expect( terms( result ) ).toEqual( [ 'recipe_cat', 'shared' ] );
	} );

	it( 'does not offer unrelated taxonomies for pages', () => {
		const { result } = renderInserter( createEditorRegistry(), {
			postType: 'page',
		} );
		expect( terms( result ) ).toEqual( [] );
	} );

	it( 'uses the insertion root inside a recipe Query on a page', () => {
		const registry = createEditorRegistry();
		const { query, root } = queryBlocks( 'recipe' );
		registry.dispatch( blockEditorStore ).resetBlocks( [ query ] );
		const { result, rerender } = renderInserter( registry, {
			postType: 'page',
		} );
		expect( terms( result ) ).toEqual( [] );
		rerender( { root } );
		expect( terms( result ) ).toEqual( [ 'recipe_cat', 'shared' ] );
		rerender( { root: undefined } );
		expect( terms( result ) ).toEqual( [] );
	} );

	it( 'honors the nearest nested Query instead of the outer query', () => {
		const registry = createEditorRegistry();
		const inner = queryBlocks( 'post' );
		const outer = queryBlocks( 'recipe' );
		outer.query.innerBlocks[ 0 ].innerBlocks = [ inner.query ];
		registry.dispatch( blockEditorStore ).resetBlocks( [ outer.query ] );
		const { result } = renderInserter(
			registry,
			{ postType: 'page' },
			inner.root
		);
		expect( terms( result ) ).toEqual( [
			'category',
			'post_tag',
			'shared',
		] );
	} );

	it( 'honors a custom context provider at the insertion point', () => {
		const registry = createEditorRegistry();
		const group = createBlock( 'core/group' );
		registry
			.dispatch( blockEditorStore )
			.resetBlocks( [
				createBlock( 'test/post-context', { entityType: 'recipe' }, [
					group,
				] ),
			] );
		const { result } = renderInserter(
			registry,
			{ postType: 'page' },
			group.clientId
		);
		expect( terms( result ) ).toEqual( [ 'recipe_cat', 'shared' ] );
	} );

	it( 'keeps unresolved inherited query contexts permissive', () => {
		const registry = createEditorRegistry();
		const { query, root } = queryBlocks( 'post', true );
		registry.dispatch( blockEditorStore ).resetBlocks( [ query ] );
		const { result } = renderInserter(
			registry,
			{ postType: 'page' },
			root
		);
		expect( terms( result ) ).toEqual(
			TAXONOMIES.map( ( taxonomy ) => taxonomy.slug )
		);
	} );

	it( 'keeps unknown template or pattern contexts permissive', () => {
		const { result } = renderInserter( createEditorRegistry() );
		expect( terms( result ) ).toEqual(
			TAXONOMIES.map( ( taxonomy ) => taxonomy.slug )
		);
	} );

	it( 'does not hide items before taxonomy metadata resolves', async () => {
		const registry = createEditorRegistry( null );
		// Keep the real selector unresolved without starting a REST request.
		registry.dispatch( coreStore ).startResolution( 'getTaxonomies', [] );
		const { result } = renderInserter( registry, { postType: 'post' } );
		expect( terms( result ) ).toEqual(
			TAXONOMIES.map( ( taxonomy ) => taxonomy.slug )
		);
		act( () => {
			registry
				.dispatch( coreStore )
				.receiveEntityRecords( 'root', 'taxonomy', TAXONOMIES, {} );
			registry
				.dispatch( coreStore )
				.finishResolution( 'getTaxonomies', [] );
		} );
		await waitFor( () =>
			expect( terms( result ) ).toEqual( [
				'category',
				'post_tag',
				'shared',
			] )
		);
	} );

	it( 'keeps separate editor registries isolated and does not alter registration', () => {
		const { result: postResult } = renderInserter( createEditorRegistry(), {
			postType: 'post',
		} );
		const { result: recipeResult } = renderInserter(
			createEditorRegistry(),
			{ postType: 'recipe' }
		);
		expect( terms( postResult ) ).toEqual( [
			'category',
			'post_tag',
			'shared',
		] );
		expect( terms( recipeResult ) ).toEqual( [ 'recipe_cat', 'shared' ] );
		const plain = createEditorRegistry();
		unlock(
			plain.dispatch( blockEditorStore )
		).__experimentalUpdateSettings( {
			[ filterInserterItemsSelectKey ]: undefined,
		} );
		const { result: unfilteredResult } = renderInserter( plain, {
			postType: 'page',
		} );
		expect( terms( unfilteredResult ) ).toEqual(
			TAXONOMIES.map( ( taxonomy ) => taxonomy.slug )
		);
	} );
} );
