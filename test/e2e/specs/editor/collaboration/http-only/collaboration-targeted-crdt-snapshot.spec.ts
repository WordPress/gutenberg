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
			date_gmt: new Date().toISOString(),
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
					if (
						error &&
						typeof error === 'object' &&
						'code' in error
					) {
						conflictCode = String( error.code );
					}
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
			date_gmt: new Date().toISOString(),
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
					if (
						error &&
						typeof error === 'object' &&
						'code' in error
					) {
						conflictCode = String( error.code );
					}
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
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openPost( post.id );

		let releaseFirstSave!: () => void;
		const firstSaveReleased = new Promise< void >( ( resolve ) => {
			releaseFirstSave = resolve;
		} );
		let markFirstSaveStarted!: () => void;
		const firstSaveStarted = new Promise< void >( ( resolve ) => {
			markFirstSaveStarted = resolve;
		} );
		const requests: Array< { doc: string; expected_doc: string } > = [];
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
			await route.fulfill( {
				status: 200,
				contentType: 'application/json',
				body: '{}',
			} );
		} );

		await page.evaluate( ( consent ) => {
			const { unlock } =
				window.wp.privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules(
					consent,
					'@wordpress/core-data'
				);
			const editorSelect = window.wp.data.select( 'core/editor' );
			const dispatch = unlock( window.wp.data.dispatch( 'core' ) );
			const queuedWindow = window as typeof window & {
				__firstQueuedSave: Promise< boolean >;
			};
			queuedWindow.__firstQueuedSave = dispatch.persistEntityCRDTDoc(
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
			const queuedWindow = window as typeof window & {
				__secondQueuedSave: Promise< boolean >;
			};
			queuedWindow.__secondQueuedSave = dispatch.persistEntityCRDTDoc(
				'postType',
				editorSelect.getCurrentPostType(),
				editorSelect.getCurrentPostId()
			);
		}, CORE_DATA_PRIVATE_APIS_CONSENT );

		expect( requests ).toHaveLength( 1 );
		releaseFirstSave();
		await page.evaluate( () => {
			const queuedWindow = window as typeof window & {
				__firstQueuedSave: Promise< boolean >;
				__secondQueuedSave: Promise< boolean >;
			};
			return Promise.all( [
				queuedWindow.__firstQueuedSave,
				queuedWindow.__secondQueuedSave,
			] );
		} );

		expect( requests ).toHaveLength( 2 );
		expect( requests[ 1 ].expected_doc ).toBe( requests[ 0 ].doc );
	} );

	test( 'repairs the selected occurrence among duplicate contentless blocks', async ( {
		collaborationUtils,
		editor,
		page,
		requestUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Targeted duplicate block repair',
			content:
				'<!-- wp:separator --><hr class="wp-block-separator has-alpha-channel-opacity"/><!-- /wp:separator -->\n\n<!-- wp:separator --><hr class="wp-block-separator has-alpha-channel-opacity"/><!-- /wp:separator -->',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openPost( post.id );

		const didPersist = await page.evaluate( async ( consent ) => {
			const { unlock } =
				window.wp.privateApis.__dangerousOptInToUnstableAPIsOnlyForCoreModules(
					consent,
					'@wordpress/core-data'
				);
			const editorSelect = window.wp.data.select( 'core/editor' );
			return unlock(
				window.wp.data.dispatch( 'core' )
			).persistEntityBlockAttributes(
				'postType',
				editorSelect.getCurrentPostType(),
				editorSelect.getCurrentPostId(),
				{
					record: editorSelect.getCurrentPost(),
					blockPath: [ 1 ],
					isMatch: ( block: { name: string } ) =>
						block.name === 'core/separator',
					matchCount: 2,
					matchIndex: 1,
					blockCount: 2,
					blockName: 'core/separator',
					attributes: { metadata: { noteId: [ 123 ] } },
				}
			);
		}, CORE_DATA_PRIVATE_APIS_CONSENT );

		expect( didPersist ).toBe( true );
		await page.reload();
		await collaborationUtils.waitForEntityReady( page );

		const blocks = await editor.getBlocks();
		expect( blocks ).toHaveLength( 2 );
		const metadata = blocks.map(
			( block ) =>
				block.attributes.metadata as { noteId?: number[] } | undefined
		);
		expect( metadata[ 0 ]?.noteId ).toBeUndefined();
		expect( metadata[ 1 ]?.noteId ).toEqual( [ 123 ] );
	} );
} );
