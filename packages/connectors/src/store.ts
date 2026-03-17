/**
 * WordPress dependencies
 */
import { createReduxStore, createSelector, register } from '@wordpress/data';

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
	registerConnector(
		slug: string,
		config: Partial< Omit< ConnectorConfig, 'slug' > >
	) {
		return {
			type: 'REGISTER_CONNECTOR' as const,
			slug,
			config,
		};
	},
	unregisterConnector( slug: string ) {
		return {
			type: 'UNREGISTER_CONNECTOR' as const,
			slug,
		};
	},
};

type Action =
	| ReturnType< typeof actions.registerConnector >
	| ReturnType< typeof actions.unregisterConnector >;

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
						...state.connectors[ action.slug ],
						slug: action.slug,
						...action.config,
					},
				},
			};
		case 'UNREGISTER_CONNECTOR': {
			if ( ! state.connectors[ action.slug ] ) {
				return state;
			}
			const { [ action.slug ]: _, ...rest } = state.connectors;
			return {
				...state,
				connectors: rest,
			};
		}
		default:
			return state;
	}
}

const selectors = {
	getConnectors: createSelector(
		( state: ConnectorsState ): ConnectorConfig[] =>
			Object.values( state.connectors ),
		( state: ConnectorsState ) => [ state.connectors ]
	),
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
