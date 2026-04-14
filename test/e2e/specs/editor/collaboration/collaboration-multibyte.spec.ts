/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - Multi-byte character encoding', () => {
	// Characters in the supplementary Unicode planes (U+10000+) are stored as
	// surrogate pairs in UTF-16, so .length >= 2 per character. The diff
	// library v8 counts them as 1 grapheme cluster via Intl.Segmenter,
	// causing a mismatch with the Delta engine's UTF-16 code-unit counting.
	// This results in split surrogate pairs rendering as U+FFFD (�).

	test( 'syncs emoji between two users without corruption', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Emoji Sync Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2 } = collaborationUtils;

		// User 1: Insert a paragraph with emoji.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello 😀 World' },
		} );

		// User 2: Verify the emoji survived the sync.
		await expect( async () => {
			const blocks = await editor2.getBlocks();
			expect( blocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello 😀 World' },
				},
			] );
			expect( blocks[ 0 ].attributes.content ).not.toContain( '\uFFFD' );
		} ).toPass( { timeout: 5000 } );
	} );

	test( 'syncs multiple emoji between users', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Multi-Emoji Sync Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2 } = collaborationUtils;

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '😀 hello 🎉 world 🚀' },
		} );

		await expect( async () => {
			const blocks = await editor2.getBlocks();
			expect( blocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: '😀 hello 🎉 world 🚀' },
				},
			] );
			expect( blocks[ 0 ].attributes.content ).not.toContain( '\uFFFD' );
		} ).toPass( { timeout: 5000 } );
	} );

	test( 'syncs emoji inserted by a collaborator', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Emoji Insert Sync Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2 } = collaborationUtils;

		// User 2: Insert a paragraph with emoji via the data API.
		await page2.evaluate( () => {
			const block = ( window as any ).wp.blocks.createBlock(
				'core/paragraph',
				{
					content: 'Hello 😀 World',
				}
			);
			( window as any ).wp.data
				.dispatch( 'core/block-editor' )
				.insertBlock( block );
		} );

		// User 1: Verify the emoji appears correctly.
		await expect( async () => {
			const blocks = await editor.getBlocks();
			expect( blocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello 😀 World' },
				},
			] );
			expect( blocks[ 0 ].attributes.content ).not.toContain( '\uFFFD' );
		} ).toPass( { timeout: 5000 } );
	} );

	test( 'syncs CJK Extension B characters (rare kanji) between users', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		// 𠮷 (U+20BB7) is used in Japanese names like 𠮷野家 (Yoshinoya).
		// It's a supplementary plane character (.length === 2, surrogate pair).
		const post = await requestUtils.createPost( {
			title: 'CJK Extension B Sync Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2 } = collaborationUtils;

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: '𠮷野家は美味しい' },
		} );

		await expect( async () => {
			const blocks = await editor2.getBlocks();
			expect( blocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: '𠮷野家は美味しい' },
				},
			] );
			expect( blocks[ 0 ].attributes.content ).not.toContain( '\uFFFD' );
		} ).toPass( { timeout: 5000 } );
	} );

	test( 'syncs mathematical symbols from supplementary plane between users', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		// 𝐀 (U+1D400, Mathematical Bold Capital A) — .length === 2
		const post = await requestUtils.createPost( {
			title: 'Math Symbol Sync Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2 } = collaborationUtils;

		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Let 𝐀 be a matrix' },
		} );

		await expect( async () => {
			const blocks = await editor2.getBlocks();
			expect( blocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Let 𝐀 be a matrix' },
				},
			] );
			expect( blocks[ 0 ].attributes.content ).not.toContain( '\uFFFD' );
		} ).toPass( { timeout: 5000 } );
	} );
} );
