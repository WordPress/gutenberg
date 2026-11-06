import { test, expect } from '../fixtures';

test.describe( 'Collaboration - WebSocket list template', () => {
	test( 'inserting a list creates a single list item for all peers', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'WebSocket List Template',
			content:
				'<!-- wp:paragraph -->\n<p>start</p>\n<!-- /wp:paragraph -->',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2 } = collaborationUtils;

		await expect
			.poll( () => editor2.getBlocks(), { timeout: 5000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'start' },
				},
			] );

		await editor.insertBlock( { name: 'core/list' } );

		const expected = [
			{
				name: 'core/paragraph',
				attributes: { content: 'start' },
			},
			{
				name: 'core/list',
				innerBlocks: [
					{
						name: 'core/list-item',
						attributes: { content: '' },
					},
				],
			},
		];

		await expect
			.poll( () => editor.getBlocks(), { timeout: 10000 } )
			.toMatchObject( expected );
		await expect
			.poll( () => editor2.getBlocks(), { timeout: 10000 } )
			.toMatchObject( expected );

		// Peer-side template synchronization arrives asynchronously.
		// Require a follow-up edit from the second peer to round-trip
		// before the final assertion, so late duplicates would have
		// arrived by then.
		await editor2.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'done' },
		} );
		const expectedFinal = [
			...expected,
			{
				name: 'core/paragraph',
				attributes: { content: 'done' },
			},
		];
		await expect
			.poll( () => editor.getBlocks(), { timeout: 10000 } )
			.toMatchObject( expectedFinal );
		expect( await editor2.getBlocks() ).toMatchObject( expectedFinal );
	} );
} );
