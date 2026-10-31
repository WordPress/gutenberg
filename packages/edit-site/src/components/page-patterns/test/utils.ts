import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parse, type Block } from '@wordpress/blocks';
import { filterOutDuplicatesByName, withLazyBlocks } from '../utils';

vi.mock( import( '@wordpress/blocks' ), () => ( {
	parse: vi.fn(),
} ) );

describe( 'filterOutDuplicatesByName', () => {
	it( 'keeps the first pattern for each name', () => {
		const first = { name: 'theme/hero', title: 'First' };
		const second = { name: 'theme/footer' };
		const duplicate = { name: 'theme/hero', title: 'Duplicate' };

		expect(
			filterOutDuplicatesByName( [ first, second, duplicate ] )
		).toEqual( [ first, second ] );
	} );

	it( 'returns an empty list for an empty list', () => {
		expect( filterOutDuplicatesByName( [] ) ).toEqual( [] );
	} );
} );

describe( 'withLazyBlocks', () => {
	const blocks = [ { name: 'core/paragraph' } ] as Block[];

	beforeEach( () => {
		vi.mocked( parse ).mockReturnValue( blocks );
	} );

	it( 'copies the pattern and adds the given properties', () => {
		const pattern = { name: 'theme/hero', content: 'content' };

		expect(
			withLazyBlocks( pattern, { type: 'pattern', keywords: [] } )
		).toMatchObject( {
			name: 'theme/hero',
			content: 'content',
			type: 'pattern',
			keywords: [],
		} );
	} );

	it( 'does not parse the content until the blocks are read', () => {
		withLazyBlocks( { name: 'theme/hero', content: 'content' } );

		expect( parse ).not.toHaveBeenCalled();
	} );

	it( 'parses the content once when the blocks are read', () => {
		const pattern = withLazyBlocks( {
			name: 'theme/hero',
			content: 'content',
		} );

		expect( pattern.blocks ).toBe( blocks );
		expect( pattern.blocks ).toBe( blocks );
		expect( parse ).toHaveBeenCalledTimes( 1 );
		expect( parse ).toHaveBeenCalledWith( 'content', {
			__unstableSkipMigrationLogs: true,
		} );
	} );

	it( 'reuses the parsed blocks for copies of the same pattern', () => {
		const source = { name: 'theme/hero', content: 'content' };

		expect( withLazyBlocks( source ).blocks ).toBe( blocks );
		expect( withLazyBlocks( source ).blocks ).toBe( blocks );
		expect( { ...withLazyBlocks( source ) }.blocks ).toBe( blocks );
		expect( parse ).toHaveBeenCalledTimes( 1 );
	} );
} );
