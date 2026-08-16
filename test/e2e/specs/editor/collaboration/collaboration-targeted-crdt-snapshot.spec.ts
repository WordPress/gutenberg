import { test, expect } from './fixtures';

const CORE_DATA_PRIVATE_APIS_CONSENT =
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.';

test.describe( 'Collaboration - targeted CRDT persistence snapshot', () => {
	test( 'reloads isolated snapshot changes without mutating or duplicating the live document', async ( {
		collaborationUtils,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Targeted CRDT snapshot',
			content:
				'<!-- wp:paragraph --><p>Original persisted content.</p><!-- /wp:paragraph -->',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openPost( post.id );

		const liveContent = await page.evaluate(
			async ( { consent, postId } ) => {
				const { unlock } =
					window.wp.privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules(
						consent,
						'@wordpress/core-data'
					);
				const coreDispatch = unlock(
					window.wp.data.dispatch( 'core' )
				);
				const persistedRecord = await window.wp.apiFetch( {
					path: `/wp/v2/posts/${ postId }?context=edit`,
				} );
				const blocks = window.wp.blocks.parse(
					persistedRecord.content.raw
				);
				blocks[ 0 ] = {
					...blocks[ 0 ],
					attributes: {
						...blocks[ 0 ].attributes,
						content: 'Targeted snapshot content.',
					},
				};
				const doc =
					await coreDispatch.createEntityCRDTPersistenceSnapshot(
						'postType',
						'post',
						postId,
						{ blocks }
					);
				await window.wp.apiFetch( {
					path: '/wp-sync/v1/save',
					method: 'POST',
					data: {
						room: `postType/post:${ postId }`,
						doc,
						expected_doc:
							persistedRecord.meta?._crdt_document || '',
					},
				} );

				return window.wp.data
					.select( 'core/block-editor' )
					.getBlocks()[ 0 ]
					.attributes.content.toString();
			},
			{ consent: CORE_DATA_PRIVATE_APIS_CONSENT, postId: post.id }
		);

		expect( liveContent ).toBe( 'Original persisted content.' );
		await page.reload();
		await collaborationUtils.waitForEntityReady( page );

		const blocks = await editor.getBlocks();
		expect( blocks ).toHaveLength( 1 );
		expect( blocks[ 0 ].attributes.content ).toBe(
			'Targeted snapshot content.'
		);
	} );
} );
