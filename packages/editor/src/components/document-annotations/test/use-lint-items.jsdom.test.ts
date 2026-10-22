import type { Mock } from 'vitest';
import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { useLintItems } from '../use-lint-items';

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => ( {
	...( await importOriginal() ),
	useSelect: vi.fn(),
} ) );

type BlockEditorSelectors = {
	getClientIdsWithDescendants: () => string[];
	getBlockAttributes: (
		clientId: string
	) => Record< string, unknown > | undefined;
};

type TestBlock = {
	clientId: string;
	attributes?: Record< string, unknown >;
};

/*
 * `useSelect` is generic over its map function. The hook passes a plain
 * mapper, so narrow the mock once here and run the mapper against stub
 * selectors — that way the test covers the hook's own block-tree mapping.
 */
const mockedUseSelect = vi.mocked( useSelect ) as unknown as Mock<
	( mapSelect: ( select: () => BlockEditorSelectors ) => unknown ) => unknown
>;

function setBlocks( blocks: TestBlock[] ) {
	const byClientId = new Map( blocks.map( ( b ) => [ b.clientId, b ] ) );
	const selectors: BlockEditorSelectors = {
		getClientIdsWithDescendants: () => blocks.map( ( b ) => b.clientId ),
		getBlockAttributes: ( clientId ) =>
			byClientId.get( clientId )?.attributes,
	};
	mockedUseSelect.mockImplementation( ( mapSelect ) =>
		mapSelect( () => selectors )
	);
}

describe( 'useLintItems', () => {
	it( 'returns an empty array when no blocks are hidden', () => {
		setBlocks( [
			{ clientId: 'a', attributes: { content: 'hello' } },
			{
				clientId: 'b',
				attributes: { metadata: { blockVisibility: true } },
			},
		] );

		const { result } = renderHook( () => useLintItems() );
		expect( result.current ).toEqual( [] );
	} );

	it( 'emits one lint item for a hidden block', () => {
		setBlocks( [
			{
				clientId: 'a',
				attributes: { metadata: { blockVisibility: false } },
			},
		] );

		const { result } = renderHook( () => useLintItems() );
		expect( result.current ).toHaveLength( 1 );
		expect( result.current[ 0 ] ).toMatchObject( {
			kind: 'lint',
			id: 'lint:hidden-block:a',
			blockClientId: 'a',
			ruleId: 'hidden-block',
			severity: 'info',
		} );
		expect( typeof result.current[ 0 ].body ).toBe( 'string' );
		expect( result.current[ 0 ].body.length ).toBeGreaterThan( 0 );
	} );

	it( 'returns items in block-tree order', () => {
		setBlocks( [
			{ clientId: 'a', attributes: {} },
			{
				clientId: 'b',
				attributes: { metadata: { blockVisibility: false } },
			},
			{ clientId: 'c', attributes: {} },
			{
				clientId: 'd',
				attributes: { metadata: { blockVisibility: false } },
			},
		] );

		const { result } = renderHook( () => useLintItems() );
		expect( result.current.map( ( i ) => i.blockClientId ) ).toEqual( [
			'b',
			'd',
		] );
	} );

	it( 'ignores blocks where blockVisibility is truthy or absent', () => {
		setBlocks( [
			{ clientId: 'a', attributes: undefined },
			{ clientId: 'b', attributes: {} },
			{ clientId: 'c', attributes: { metadata: {} } },
			{
				clientId: 'd',
				attributes: { metadata: { blockVisibility: true } },
			},
			{
				clientId: 'e',
				attributes: {
					metadata: { blockVisibility: { viewport: {} } },
				},
			},
		] );

		const { result } = renderHook( () => useLintItems() );
		expect( result.current ).toEqual( [] );
	} );
} );
