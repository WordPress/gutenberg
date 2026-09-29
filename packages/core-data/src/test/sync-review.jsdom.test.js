import { expect, it, vi } from 'vitest';
import { createSyncReviewHandlers } from '../sync-review';
vi.mock( '../lock-unlock', () => ( { unlock: ( value ) => value } ) );
it( 'mirrors review items and aggregates notices past the threshold', () => {
	const dispatch = {
		setSyncReviewItems: vi.fn(),
		restoreSyncProposal: vi.fn(),
		resolveSyncProposal: vi.fn(),
	};
	const notices = { createNotice: vi.fn(), removeNotice: vi.fn() };
	const handlers = createSyncReviewHandlers(
		{ dispatch: ( store ) => ( store === 'core' ? dispatch : notices ) },
		'postType',
		'post',
		1
	);
	const makeItem = ( id ) => ( {
		id,
		unitId: id,
		isLocal: true,
		actorId: 'actor',
		reason: 'frame-conflict',
		intentType: 'insert_text',
		summary: 'text',
	} );

	// Below the threshold: the list is mirrored and the per-item
	// escalation notice is created.
	handlers.onProposalsChange( [ makeItem( 'p1' ) ] );
	handlers.onEscalation( {
		isLocal: true,
		proposalId: 'p1',
		summary: 'text',
	} );
	expect( dispatch.setSyncReviewItems ).toHaveBeenCalledWith(
		'postType',
		'post',
		1,
		[ makeItem( 'p1' ) ]
	);
	expect( notices.createNotice ).toHaveBeenCalledTimes( 1 );

	// A burst past the threshold sweeps per-item notices, creates one
	// aggregate notice, and suppresses further per-item notices.
	const burst = [ 'p1', 'p2', 'p3', 'p4' ].map( makeItem );
	handlers.onProposalsChange( burst );
	burst.forEach( ( item ) =>
		handlers.onEscalation( {
			isLocal: true,
			proposalId: item.id,
			summary: 'text',
		} )
	);
	expect( notices.removeNotice ).toHaveBeenCalledWith(
		'core-data-sync-escalation-postType-post-1-p1'
	);
	expect( notices.createNotice ).toHaveBeenCalledWith(
		'warning',
		expect.stringContaining( '4' ),
		expect.objectContaining( {
			id: 'core-data-sync-review-aggregate-postType-post-1',
		} )
	);
	expect( notices.createNotice ).toHaveBeenCalledTimes( 2 );

	// Emptying the list clears the aggregate notice and the store key.
	handlers.onProposalsChange( [] );
	expect( notices.removeNotice ).toHaveBeenCalledWith(
		'core-data-sync-review-aggregate-postType-post-1'
	);
	expect( dispatch.setSyncReviewItems ).toHaveBeenLastCalledWith(
		'postType',
		'post',
		1,
		[]
	);
} );
