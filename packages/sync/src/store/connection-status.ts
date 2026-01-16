/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

const STORE_NAME = 'core/sync-connection';

export enum SyncConnectionErrorType {
	/**
	 * Authentication failed - invalid credentials or unauthorized access.
	 */
	AUTH_FAILED = 'auth-failed',

	/**
	 * Server has reached maximum connection capacity.
	 */
	TOO_MANY_CONNECTIONS = 'too-many-connections',

	/**
	 * Sync connection has expired and requires reconnection.
	 * Used for security-based disconnections (e.g., periodic forced reconnect).
	 */
	CONNECTION_EXPIRED = 'connection-expired',

	/**
	 * Provider-specific error requiring custom title and description.
	 */
	CUSTOM = 'custom',
}

/**
 * Connection status values.
 */
export enum SyncConnectionStatus {
	CONNECTED = 'connected',
	DISCONNECTED = 'disconnected',
}

/**
 * Metadata about a connection error.
 */
export interface SyncConnectionMetadata {
	/**
	 * Type of error - can be a standard type or a custom string.
	 */
	errorType?: SyncConnectionErrorType | string;

	/**
	 * Custom title to override the default title for this error type.
	 */
	title?: string;

	/**
	 * Custom description to override the default description for this error type.
	 */
	description?: string;
}

interface ConnectionState {
	status: SyncConnectionStatus;
	metadata: SyncConnectionMetadata;
}

interface State {
	/**
	 * Map of connection ID to connection state.
	 */
	connections: Record< string, ConnectionState >;
}

interface SetConnectionStatusAction {
	type: 'SET_CONNECTION_STATUS';
	connectionId: string;
	status: SyncConnectionStatus;
	metadata: SyncConnectionMetadata;
}

interface ClearConnectionStatusAction {
	type: 'CLEAR_CONNECTION_STATUS';
	connectionId: string;
}

type Action = SetConnectionStatusAction | ClearConnectionStatusAction;

const DEFAULT_STATE: State = {
	connections: {},
};

const actions = {
	/**
	 * Set the connection status for a sync connection.
	 *
	 * @param connectionId Unique connection identifier.
	 * @param status       Connection status.
	 * @param metadata     Metadata about the connection.
	 */
	setConnectionStatus(
		connectionId: string,
		status: SyncConnectionStatus,
		metadata: SyncConnectionMetadata = {}
	): SetConnectionStatusAction {
		return {
			type: 'SET_CONNECTION_STATUS',
			connectionId,
			status,
			metadata,
		};
	},

	/**
	 * Clear the connection status for a sync connection.
	 *
	 * @param connectionId Unique connection identifier.
	 */
	clearConnectionStatus( connectionId: string ): ClearConnectionStatusAction {
		return {
			type: 'CLEAR_CONNECTION_STATUS',
			connectionId,
		};
	},
};

const reducer = ( state = DEFAULT_STATE, action: Action ): State => {
	switch ( action.type ) {
		case 'SET_CONNECTION_STATUS': {
			return {
				...state,
				connections: {
					...state.connections,
					[ action.connectionId ]: {
						status: action.status,
						metadata: action.metadata,
					},
				},
			};
		}

		case 'CLEAR_CONNECTION_STATUS': {
			const { [ action.connectionId ]: _, ...rest } = state.connections;
			return {
				...state,
				connections: rest,
			};
		}

		default:
			return state;
	}
};

const selectors = {
	/**
	 * Get the connection status for a specific connection.
	 *
	 * @param state        Store state.
	 * @param connectionId Unique connection identifier.
	 * @return Connection state or null if not found.
	 */
	getConnectionStatus(
		state: State,
		connectionId: string
	): ConnectionState | null {
		return state.connections[ connectionId ] ?? null;
	},

	/**
	 * Check if any connection is currently disconnected.
	 *
	 * @param state Store state.
	 * @return True if any connection is disconnected.
	 */
	isDisconnected( state: State ): boolean {
		return Object.values( state.connections ).some(
			( connection ) =>
				connection.status === SyncConnectionStatus.DISCONNECTED
		);
	},

	/**
	 * Get a disconnected connection (for displaying error UI).
	 *
	 * @param state Store state.
	 * @return Connection ID and connection state, or null if all connected.
	 */
	getDisconnectedConnection( state: State ): {
		connectionId: string;
		status: SyncConnectionStatus;
		metadata?: SyncConnectionMetadata;
	} | null {
		const entry = Object.entries( state.connections ).find(
			( [ , connection ] ) =>
				connection.status === SyncConnectionStatus.DISCONNECTED
		);

		if ( ! entry ) {
			return null;
		}

		const [ connectionId, connection ] = entry;
		return {
			connectionId,
			status: connection.status,
			metadata: connection.metadata,
		};
	},
};

/**
 * Store definition.
 */
export const store = createReduxStore( STORE_NAME, {
	reducer,
	actions,
	selectors,
} );

register( store );

/**
 * Type definitions for store actions.
 */
export type SyncConnectionStoreActions = typeof actions;

/**
 * Type definitions for store selectors.
 */
export type SyncConnectionStoreSelectors = {
	getConnectionStatus: ( connectionId: string ) => ConnectionState | null;
	isDisconnected: () => boolean;
	getDisconnectedConnection: () => {
		connectionId: string;
		status: SyncConnectionStatus;
		metadata: SyncConnectionMetadata;
	} | null;
};
