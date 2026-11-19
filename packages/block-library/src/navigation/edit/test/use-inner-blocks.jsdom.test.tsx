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
} );
