import { test, expect } from '../fixtures';

const CORE_DATA_PRIVATE_APIS_CONSENT =
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.';

test.describe( 'Collaboration - targeted CRDT persistence snapshot', () => {
	test( 'persists an isolated snapshot without mutating or duplicating block content', async ( {
		collaborationUtils,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Targeted CRDT snapshot',
			content:
				'<!-- wp:paragraph --><p>Original persisted content.</p><!-- /wp:paragraph -->\n\n<!-- wp:paragraph --><p>Preserved sibling content.</p><!-- /wp:paragraph -->',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openPost( post.id );

		const result = await page.evaluate(
			async ( { consent, postId } ) => {
				const privateApis = ( window as any ).wp.privateApis;
				const { unlock } =
					privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules(
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
				const savedRecord = await window.wp.apiFetch( {
					path: `/wp/v2/posts/${ postId }?context=edit`,
				} );
				const { CRDT_RECORD_MAP_KEY } = unlock(
					( window as any ).wp.sync.privateApis
				);
				const snapshot = new ( window as any ).wp.sync.Y.Doc();
				const encodedDocument = JSON.parse( doc ).document;
				const update = Uint8Array.from(
					window.atob( encodedDocument ),
					( character ) => character.charCodeAt( 0 )
				);
				( window as any ).wp.sync.Y.applyUpdateV2( snapshot, update );
				const snapshotBlocks = snapshot
					.getMap( CRDT_RECORD_MAP_KEY )
					.get( 'blocks' )
					.toJSON();
				snapshot.destroy();

				return {
					doc,
					persistedDoc: savedRecord.meta?._crdt_document,
					snapshotContent: snapshotBlocks.map(
						( block: { attributes: { content: string } } ) =>
							block.attributes.content
					),
					liveContent: window.wp.data
						.select( 'core/block-editor' )
						.getBlocks()
						.map(
							( block: {
								attributes: {
									content: { toString: () => string };
								};
							} ) => block.attributes.content.toString()
						),
				};
			},
			{ consent: CORE_DATA_PRIVATE_APIS_CONSENT, postId: post.id }
		);

		expect( result.persistedDoc ).toBe( result.doc );
		expect( result.snapshotContent ).toEqual( [
			'Targeted snapshot content.',
			'Preserved sibling content.',
		] );
		expect( result.liveContent ).toEqual( [
			'Original persisted content.',
			'Preserved sibling content.',
		] );
		await page.reload();
		await collaborationUtils.waitForEntityReady( page );

		const blocks = await editor.getBlocks();
		expect( blocks ).toHaveLength( 2 );
		expect( blocks[ 0 ].attributes.content ).toBe(
			'Original persisted content.'
		);
		expect( blocks[ 1 ].attributes.content ).toBe(
			'Preserved sibling content.'
		);
	} );
} );
