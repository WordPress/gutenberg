/**
 * External dependencies
 */
import { removeAwarenessStates } from 'y-protocols/awareness';
import type { Awareness } from 'y-protocols/awareness';

/**
 * Internal dependencies
 */
import type { AwarenessState } from './session';

/*
 * Engine-agnostic bridging between the transport's plain-JSON awareness
 * states (client id → state, as merged and returned by the sync server on
 * every poll) and a y-protocols Awareness instance (the presence surface the
 * editor's collaborator UI consumes). Extracted from the yjs session codec;
 * the intent-log session uses the same logic — presence is transport data,
 * not engine semantics.
 *
 * The Awareness class itself is engine-neutral: it only reads `clientID`
 * from its constructor argument (plus a 'destroy' listener), so engines
 * without a Y.Doc can construct one over a stub (see createAwarenessDoc).
 */

/**
 * Creates the minimal doc surface the y-protocols Awareness constructor
 * needs, for engines that have no Y.Doc.
 *
 * @param clientID The transport client id.
 * @return A doc stub.
 */
export function createAwarenessDoc( clientID: number ): {
	clientID: number;
	on: () => void;
	off: () => void;
} {
	return { clientID, on: () => {}, off: () => {} };
}

/**
 * Applies a server-merged awareness state map onto an Awareness instance:
 * adds/updates remote client states, removes clients absent from the server
 * state, skips the local client, and emits the change events subscribers
 * expect.
 *
 * @param state     Server awareness map (client id → state).
 * @param awareness The Awareness instance to update.
 * @param origin    Origin tag for removal events.
 */
export function applyServerAwarenessStates(
	state: AwarenessState,
	awareness: Awareness,
	origin: string
): void {
	const currentStates = awareness.getStates();
	const added = new Set< number >();
	const updated = new Set< number >();

	// Removed clients are missing from the server state.
	const removed = new Set< number >(
		Array.from( currentStates.keys() ).filter(
			( clientId ) => ! state[ clientId ]
		)
	);

	Object.entries( state ).forEach( ( [ clientIdString, awarenessState ] ) => {
		const clientId = Number( clientIdString );

		// Skip our own state (we already have it locally).
		if ( clientId === awareness.clientID ) {
			return;
		}

		// A null state should be removed by the server, but handle it here just in case.
		if ( null === awarenessState ) {
			currentStates.delete( clientId );
			removed.add( clientId );
			return;
		}

		if ( ! currentStates.has( clientId ) ) {
			currentStates.set( clientId, awarenessState );
			added.add( clientId );
			return;
		}

		const currentState = currentStates.get( clientId );

		if (
			JSON.stringify( currentState ) !== JSON.stringify( awarenessState )
		) {
			currentStates.set( clientId, awarenessState );
			updated.add( clientId );
		}
	} );

	if ( added.size + updated.size > 0 ) {
		awareness.emit( 'change', [
			{
				added: Array.from( added ),
				updated: Array.from( updated ),
				// Left blank on purpose, as the removal of clients is handled in the if condition below.
				removed: [],
			},
		] );
	}

	if ( removed.size > 0 ) {
		removeAwarenessStates( awareness, Array.from( removed ), origin );
	}
}
