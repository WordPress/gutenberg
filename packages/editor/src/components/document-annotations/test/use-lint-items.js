/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( cb ) => cb( () => mockBlockEditorSelectors ),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );

/**
 * Internal dependencies
 */
import { useLintItems } from '../use-lint-items';

let mockBlockEditorSelectors;

function setBlocks( blocks ) {
	const byClientId = new Map( blocks.map( ( b ) => [ b.clientId, b ] ) );
	mockBlockEditorSelectors = {
		getClientIdsWithDescendants: () => blocks.map( ( b ) => b.clientId ),
		getBlockAttributes: ( clientId ) =>
			byClientId.get( clientId )?.attributes,
	};
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
