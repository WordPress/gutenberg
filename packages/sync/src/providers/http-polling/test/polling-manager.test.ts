import type { SyncResponse } from '../types';
	// Shrink the per-request room cap so rotation tests don't need 50+
	// registered rooms. Existing tests register at most 2 rooms and
	// stay well under this cap.
	MAX_ROOMS_PER_REQUEST: 10,
	base64ToUint8Array: jest.fn( () => new Uint8Array() ),
	unregisterRoom: ( room: string ) => void;
	describe( 'error recovery', () => {
		it( 'replaces queued updates with a compaction after a poll error', async () => {
			// First poll: succeed with collaborators to resume the queue.
			const responseWithCollaborator = {
				rooms: [
					{
						room: 'test-room',
						end_cursor: 1,
						awareness: { 1: {}, 2: {} },
						updates: [],
					},
				],
			};
			mockPostSyncUpdate.mockResolvedValueOnce(
				responseWithCollaborator
			);

			const doc = createMockDoc( 1 );
			pollingManager.registerRoom( {
				room: 'test-room',
				doc,
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			// Flush the initial poll (queue is paused, so no updates sent).
			await jest.advanceTimersByTimeAsync( 0 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 1 );

			// Add a document update (queue is now resumed due to collaborators).
			const onDocUpdate = getOnDocUpdate( doc );
			onDocUpdate( new Uint8Array( [ 1, 2, 3 ] ), 'user' );

			// Second poll: fail with a network error.
			mockPostSyncUpdate.mockRejectedValueOnce( new Error( 'timeout' ) );
			await jest.advanceTimersByTimeAsync( 1000 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 2 );

			// Verify the second poll included the queued updates (sync_step1 + doc update).
			const secondCallPayload = mockPostSyncUpdate.mock
				.calls[ 1 ][ 0 ] as {
				rooms: Array< {
					updates: Array< { type: string } >;
				} >;
			};
			expect(
				secondCallPayload.rooms[ 0 ].updates.length
			).toBeGreaterThan( 0 );

			// Third poll: succeed — verify it sends a compaction instead of
			// restoring the same updates.
			mockPostSyncUpdate.mockResolvedValueOnce(
				responseWithCollaborator
			);

			// Error handler doubled the interval: min(1000 * 2, 30000) = 2000.
			await jest.advanceTimersByTimeAsync( 2000 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 3 );

			const thirdCallPayload = mockPostSyncUpdate.mock
				.calls[ 2 ][ 0 ] as {
				rooms: Array< {
					updates: Array< { type: string } >;
				} >;
			};
			const retryUpdates = thirdCallPayload.rooms[ 0 ].updates;
			expect( retryUpdates ).toHaveLength( 1 );
			expect( retryUpdates[ 0 ].type ).toBe( 'compaction' );
		} );

		it( 'does not queue a compaction for rooms with no outgoing updates', async () => {
			// First poll succeeds (no collaborators, queue stays paused).
			mockPostSyncUpdate.mockResolvedValueOnce( syncResponse );

			pollingManager.registerRoom( {
				room: 'test-room',
				doc: createMockDoc( 1 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );

			await jest.advanceTimersByTimeAsync( 0 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 1 );

			// Second poll: fail (no updates were sent because queue is paused).
			mockPostSyncUpdate.mockRejectedValueOnce( new Error( 'timeout' ) );
			await jest.advanceTimersByTimeAsync( 4000 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 2 );

			// Verify no updates were sent on the failed poll.
			const secondCallPayload = mockPostSyncUpdate.mock
				.calls[ 1 ][ 0 ] as {
				rooms: Array< {
					updates: Array< { type: string } >;
				} >;
			};
			expect( secondCallPayload.rooms[ 0 ].updates ).toHaveLength( 0 );

			// Third poll: succeed — should still have no updates (no compaction queued).
			mockPostSyncUpdate.mockResolvedValueOnce( syncResponse );
			await jest.advanceTimersByTimeAsync( 8000 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 3 );

			const thirdCallPayload = mockPostSyncUpdate.mock
				.calls[ 2 ][ 0 ] as {
				rooms: Array< {
					updates: Array< { type: string } >;
				} >;
			};
			expect( thirdCallPayload.rooms[ 0 ].updates ).toHaveLength( 0 );
		} );
	} );

		} );
	} );

	describe( 'room overflow rotation', () => {
		// The outer mock sets MAX_ROOMS_PER_REQUEST to 10. Tests in this
		// block register a primary room plus additional "overflow" rooms
		// to exercise the rotation behavior. With cap=10 and the primary
		// pinned, each request carries 9 overflow slots.
		//
		// Note: the first registerRoom call triggers poll() synchronously,
		// so the first poll's payload contains only the primary room.
		// Overflow rooms registered in the same tick are picked up starting
		// with the second poll, which is when rotation behavior kicks in.

		function registerRoom( pollingMgr: PollingManager, room: string ) {
			pollingMgr.registerRoom( {
				room,
				doc: createMockDoc( 1 ),
				awareness: createMockAwareness(),
				log: jest.fn(),
				onStatusChange: jest.fn(),
				onSync: jest.fn(),
			} );
		}

		function registerPrimaryAndOverflow(
			pollingMgr: PollingManager,
			overflowCount: number
		): string[] {
			registerRoom( pollingMgr, 'primary' );
			const overflowNames: string[] = [];
			for ( let i = 1; i <= overflowCount; i++ ) {
				const name = `o${ i }`;
				overflowNames.push( name );
				registerRoom( pollingMgr, name );
			}
			return overflowNames;
		}

		function getRoomNames( callIndex: number ): string[] {
			const payload = mockPostSyncUpdate.mock.calls[ callIndex ][ 0 ] as {
				rooms: { room: string }[];
			};
			return payload.rooms.map( ( r ) => r.room );
		}

		it( 'sends every room in a single request when the count is at or under the cap', async () => {
			mockPostSyncUpdate.mockResolvedValue( { rooms: [] } );

			// Primary + 9 overflow = 10 rooms, exactly at the cap.
			const overflow = registerPrimaryAndOverflow( pollingManager, 9 );

			await jest.advanceTimersByTimeAsync( 0 );
			await jest.advanceTimersByTimeAsync( 4000 );

			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 2 );

			// First poll fires synchronously with only the primary room.
			expect( getRoomNames( 0 ) ).toEqual( [ 'primary' ] );

			// Second poll includes every registered room in a single
			// request (fast path since total rooms === cap).
			expect( getRoomNames( 1 ) ).toEqual( [ 'primary', ...overflow ] );
		} );

		it( 'caps each request at MAX_ROOMS_PER_REQUEST and always includes the primary room', async () => {
			mockPostSyncUpdate.mockResolvedValue( { rooms: [] } );

			// Primary + 11 overflow = 12 rooms, over the cap of 10.
			registerPrimaryAndOverflow( pollingManager, 11 );

			await jest.advanceTimersByTimeAsync( 0 );
			await jest.advanceTimersByTimeAsync( 4000 );
			await jest.advanceTimersByTimeAsync( 4000 );

			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 3 );

			// First poll: only the primary room was registered yet.
			expect( getRoomNames( 0 ) ).toEqual( [ 'primary' ] );

			// Subsequent polls cap at MAX_ROOMS_PER_REQUEST and pin primary.
			for ( let i = 1; i < 3; i++ ) {
				const names = getRoomNames( i );
				expect( names ).toHaveLength( 10 );
				expect( names[ 0 ] ).toBe( 'primary' );
			}
		} );

		it( 'rotates overflow rooms across successive polls until all are covered', async () => {
			mockPostSyncUpdate.mockResolvedValue( { rooms: [] } );

			// Primary + 15 overflow = 16 rooms. Skipping the primary-only
			// first poll, two subsequent rotation polls send 18 slots —
			// enough to cover every overflow room at least once.
			const overflow = registerPrimaryAndOverflow( pollingManager, 15 );

			await jest.advanceTimersByTimeAsync( 0 );
			await jest.advanceTimersByTimeAsync( 4000 );
			await jest.advanceTimersByTimeAsync( 4000 );

			const overflowSeen = new Set< string >();
			// Skip poll 0 (primary only); inspect rotation polls.
			for ( let i = 1; i < 3; i++ ) {
				for ( const name of getRoomNames( i ) ) {
					if ( name !== 'primary' ) {
						overflowSeen.add( name );
					}
				}
			}

			expect( overflowSeen ).toEqual( new Set( overflow ) );
		} );

		it( 'advances the rotation window so successive polls send different overflow rooms', async () => {
			mockPostSyncUpdate.mockResolvedValue( { rooms: [] } );

			// Primary + 11 overflow rooms, 9 slots per request.
			registerPrimaryAndOverflow( pollingManager, 11 );

			await jest.advanceTimersByTimeAsync( 0 );
			await jest.advanceTimersByTimeAsync( 4000 );
			await jest.advanceTimersByTimeAsync( 4000 );

			// Compare the two rotation polls (poll 0 is primary-only).
			const first = getRoomNames( 1 ).slice( 1 );
			const second = getRoomNames( 2 ).slice( 1 );

			expect( first ).not.toEqual( second );
			// Two rotation polls of 9 slots against 11 overflow rooms
			// cover the entire set.
			expect( new Set( [ ...first, ...second ] ).size ).toBe( 11 );
		} );

		it( 'advances the rotation window even when a poll fails', async () => {
			// Primary + 11 overflow rooms, 9 slots per request.
			registerPrimaryAndOverflow( pollingManager, 11 );

			// Poll 1: primary only (fires synchronously at registration).
			mockPostSyncUpdate.mockResolvedValueOnce( { rooms: [] } );
			await jest.advanceTimersByTimeAsync( 0 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 1 );
			expect( getRoomNames( 0 ) ).toEqual( [ 'primary' ] );

			// Poll 2 fails while sending primary + 9 overflow. The
			// rotation offset should still advance past this window.
			mockPostSyncUpdate.mockRejectedValueOnce( new Error( 'network' ) );
			await jest.advanceTimersByTimeAsync( 4000 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 2 );

			const failedSent = getRoomNames( 1 );
			expect( failedSent ).toHaveLength( 10 );
			expect( failedSent[ 0 ] ).toBe( 'primary' );

			// Poll 3 retries after the failure and should send a different
			// overflow slice, proving the offset advanced despite the error.
			mockPostSyncUpdate.mockResolvedValueOnce( { rooms: [] } );
			await jest.advanceTimersByTimeAsync( 2000 );
			expect( mockPostSyncUpdate ).toHaveBeenCalledTimes( 3 );

			const retrySent = getRoomNames( 2 );
			expect( retrySent ).toHaveLength( 10 );
			expect( retrySent[ 0 ] ).toBe( 'primary' );
			expect( retrySent ).not.toEqual( failedSent );
		} );

		it( 'chunks the page-hide disconnect beacon so each request stays under the cap', async () => {
			mockPostSyncUpdate.mockResolvedValue( { rooms: [] } );

			// 21 rooms at cap=10 => three beacons (10 + 10 + 1).
			registerPrimaryAndOverflow( pollingManager, 20 );

			// Flush the initial poll so the pagehide test observes
			// postSyncUpdateNonBlocking calls from the page-hide handler only.
			await jest.advanceTimersByTimeAsync( 0 );
			mockPostSyncUpdateNonBlocking.mockClear();

			window.dispatchEvent( new Event( 'pagehide' ) );

			expect( mockPostSyncUpdateNonBlocking ).toHaveBeenCalledTimes( 3 );

			const beaconsSent = mockPostSyncUpdateNonBlocking.mock.calls.map(
				( call ) =>
					( call[ 0 ] as { rooms: { room: string }[] } ).rooms.length
			);
			expect( beaconsSent.every( ( n ) => n <= 10 ) ).toBe( true );
			expect( beaconsSent.reduce( ( a, b ) => a + b, 0 ) ).toBe( 21 );
