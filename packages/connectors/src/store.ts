/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import type { ConnectorConfig, ConnectorsState } from './types';
import { unlock } from './lock-unlock';

const STORE_NAME = 'core/connectors';

const DEFAULT_STATE: ConnectorsState = {
	connectors: {},
};

const actions = {
	registerConnector( slug: string, config: Omit< ConnectorConfig, 'slug' > ) {
		return {
			type: 'REGISTER_CONNECTOR' as const,
			slug,
			config,
		};
	},
};

type Action = ReturnType< typeof actions.registerConnector >;

function reducer(
	state: ConnectorsState = DEFAULT_STATE,
	action: Action
): ConnectorsState {
	switch ( action.type ) {
		case 'REGISTER_CONNECTOR':
			return {
				...state,
				connectors: {
					...state.connectors,
					[ action.slug ]: {
						slug: action.slug,
						...action.config,
					},
				},
			};
		default:
			return state;
	}
}

const selectors = {
	getConnectors( state: ConnectorsState ): ConnectorConfig[] {
		return Object.values( state.connectors );
	},
	getConnector(
		state: ConnectorsState,
		slug: string
	): ConnectorConfig | undefined {
		return state.connectors[ slug ];
	},
};

export const store = createReduxStore( STORE_NAME, {
	reducer,
} );

register( store );
unlock( store ).registerPrivateActions( actions );
unlock( store ).registerPrivateSelectors( selectors );

export { STORE_NAME };
