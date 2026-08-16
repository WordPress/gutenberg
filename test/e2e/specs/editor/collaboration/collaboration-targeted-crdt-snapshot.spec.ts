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

	test( 'rejects a stale CRDT snapshot writer', async ( {
		collaborationUtils,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'CRDT snapshot conflict',
			content:
				'<!-- wp:paragraph --><p>Conflict base.</p><!-- /wp:paragraph -->',
			status: 'draft',
		} );
		await collaborationUtils.openPost( post.id );

		const result = await page.evaluate(
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
				const expectedDoc = persistedRecord.meta?._crdt_document || '';
				const firstDoc =
					await coreDispatch.createEntityCRDTPersistenceSnapshot(
						'postType',
						'post',
						postId,
						{ title: 'First writer' }
					);
				const staleDoc =
					await coreDispatch.createEntityCRDTPersistenceSnapshot(
						'postType',
						'post',
						postId,
						{ title: 'Stale writer' }
					);
				await window.wp.apiFetch( {
					path: '/wp-sync/v1/save',
					method: 'POST',
					data: {
						room: `postType/post:${ postId }`,
						doc: firstDoc,
						expected_doc: expectedDoc,
					},
				} );

				let conflictCode = null;
				try {
					await window.wp.apiFetch( {
						path: '/wp-sync/v1/save',
						method: 'POST',
						data: {
							room: `postType/post:${ postId }`,
							doc: staleDoc,
							expected_doc: expectedDoc,
						},
					} );
				} catch ( error ) {
					conflictCode = error.code;
				}
				const finalRecord = await window.wp.apiFetch( {
					path: `/wp/v2/posts/${ postId }?context=edit`,
				} );
				return {
					conflictCode,
					firstDoc,
					persistedDoc: finalRecord.meta?._crdt_document,
				};
			},
			{ consent: CORE_DATA_PRIVATE_APIS_CONSENT, postId: post.id }
		);

		expect( result.conflictCode ).toBe( 'rest_sync_document_conflict' );
		expect( result.persistedDoc ).toBe( result.firstDoc );
	} );

	test( 'rolls back content when the matching CRDT snapshot is stale', async ( {
		collaborationUtils,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Atomic synchronized entity save',
			content:
				'<!-- wp:paragraph --><p>Atomic content base.</p><!-- /wp:paragraph -->',
			status: 'draft',
		} );
		await collaborationUtils.openPost( post.id );

		const result = await page.evaluate(
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
				const originalContent = persistedRecord.content.raw;
				const expectedDoc = persistedRecord.meta?._crdt_document || '';
				const winningDoc =
					await coreDispatch.createEntityCRDTPersistenceSnapshot(
						'postType',
						'post',
						postId,
						{ title: 'Winning snapshot' }
					);
				const staleEntityDoc =
					await coreDispatch.createEntityCRDTPersistenceSnapshot(
						'postType',
						'post',
						postId,
						{ title: 'Stale entity snapshot' }
					);
				await window.wp.apiFetch( {
					path: '/wp-sync/v1/save',
					method: 'POST',
					data: {
						room: `postType/post:${ postId }`,
						doc: winningDoc,
						expected_doc: expectedDoc,
					},
				} );

				let conflictCode = null;
				try {
					await window.wp.apiFetch( {
						path: '/wp-sync/v1/save-entity',
						method: 'POST',
						data: {
							room: `postType/post:${ postId }`,
							expected_content: originalContent,
							expected_doc: expectedDoc,
							content:
								'<!-- wp:paragraph --><p>Torn replacement.</p><!-- /wp:paragraph -->',
							doc: staleEntityDoc,
						},
					} );
				} catch ( error ) {
					conflictCode = error.code;
				}
				const finalRecord = await window.wp.apiFetch( {
					path: `/wp/v2/posts/${ postId }?context=edit`,
				} );
				return {
					conflictCode,
					originalContent,
					winningDoc,
					finalContent: finalRecord.content.raw,
					finalDoc: finalRecord.meta?._crdt_document,
				};
			},
			{ consent: CORE_DATA_PRIVATE_APIS_CONSENT, postId: post.id }
		);

		expect( result.conflictCode ).toBe( 'rest_sync_document_conflict' );
		expect( result.finalContent ).toBe( result.originalContent );
		expect( result.finalDoc ).toBe( result.winningDoc );
	} );

	test( 'serializes overlapping CRDT saves for the same room', async ( {
		collaborationUtils,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Queued CRDT persistence',
			content:
				'<!-- wp:paragraph --><p>Queued persistence base.</p><!-- /wp:paragraph -->',
			status: 'draft',
		} );
		await collaborationUtils.openPost( post.id );

		let releaseFirstSave;
		const firstSaveReleased = new Promise< void >( ( resolve ) => {
			releaseFirstSave = resolve;
		} );
		let markFirstSaveStarted;
		const firstSaveStarted = new Promise< void >( ( resolve ) => {
			markFirstSaveStarted = resolve;
		} );
		const requests = [];
		await page.route( '**/*', async ( route ) => {
			const request = route.request();
			const url = new URL( request.url() );
			const restPath =
				url.searchParams.get( 'rest_route' ) ||
				url.pathname.replace( /^\/wp-json/, '' );
			if (
				request.method() !== 'POST' ||
				restPath !== '/wp-sync/v1/save'
			) {
				await route.continue();
				return;
			}

			requests.push( request.postDataJSON() );
			if ( requests.length === 1 ) {
				markFirstSaveStarted();
				await firstSaveReleased;
			}
			await route.continue();
		} );

		await page.evaluate( ( consent ) => {
			const { unlock } =
				window.wp.privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules(
					consent,
					'@wordpress/core-data'
				);
			const editorSelect = window.wp.data.select( 'core/editor' );
			const dispatch = unlock( window.wp.data.dispatch( 'core' ) );
			window.__firstQueuedSave = dispatch.persistEntityCRDTDoc(
				'postType',
				editorSelect.getCurrentPostType(),
				editorSelect.getCurrentPostId()
			);
		}, CORE_DATA_PRIVATE_APIS_CONSENT );
		await firstSaveStarted;
		await page.evaluate( ( consent ) => {
			const { unlock } =
				window.wp.privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules(
					consent,
					'@wordpress/core-data'
				);
			const editorSelect = window.wp.data.select( 'core/editor' );
			const dispatch = unlock( window.wp.data.dispatch( 'core' ) );
			window.__secondQueuedSave = dispatch.persistEntityCRDTDoc(
				'postType',
				editorSelect.getCurrentPostType(),
				editorSelect.getCurrentPostId()
			);
		}, CORE_DATA_PRIVATE_APIS_CONSENT );

		expect( requests ).toHaveLength( 1 );
		releaseFirstSave();
		await page.evaluate( () =>
			Promise.all( [
				window.__firstQueuedSave,
				window.__secondQueuedSave,
			] )
		);

		expect( requests ).toHaveLength( 2 );
		expect( requests[ 1 ].expected_doc ).toBe( requests[ 0 ].doc );
	} );
} );
