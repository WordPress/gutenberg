import { describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import { getCachedBlocks, setCachedBlocks } from '../parsed-blocks-cache';

describe( 'parsed blocks cache', () => {
	const content = '<!-- wp:test/block /-->';
	const blocks = [];

	it( 'returns an entry parsed from the same content with the same block types', () => {
		setCachedBlocks( 'postType', 'page', 1, content, blocks );

		expect( getCachedBlocks( 'postType', 'page', 1, content ) ).toBe(
			blocks
		);
	} );

	it( 'discards an entry when the content changed', () => {
		setCachedBlocks( 'postType', 'page', 2, content, blocks );

		expect(
			getCachedBlocks( 'postType', 'page', 2, '<!-- wp:test/other /-->' )
		).toBeUndefined();
	} );

	it( 'discards an entry once block types register, so blocks parsed too early are not served', () => {
		// Parsed and cached while `test/block` was not registered — as happens
		// when a record resolves before the editor's assets have loaded.
		setCachedBlocks( 'postType', 'page', 3, content, blocks );

		registerBlockType( 'test/block', {
			apiVersion: 3,
			title: 'Test Block',
			category: 'text',
		} );

		try {
			expect(
				getCachedBlocks( 'postType', 'page', 3, content )
			).toBeUndefined();
		} finally {
			unregisterBlockType( 'test/block' );
		}
	} );
} );
