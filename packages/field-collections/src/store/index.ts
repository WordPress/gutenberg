/**
 * WordPress dependencies
 */
import { createReduxStore, register } from '@wordpress/data';

/**
 * Internal dependencies
 */
import reducer from './reducer';
import * as privateActions from './private-actions';
import * as selectors from './selectors';
import * as resolvers from './resolvers';
import type { State } from './types';
import { unlock } from '../lock-unlock';

export const STORE_NAME: string = 'core/field-collections';

export const storeConfig = {
	reducer,
	selectors,
	resolvers,
} satisfies {
	reducer: typeof reducer;
	selectors: typeof selectors;
	resolvers: typeof resolvers;
};

export const store: ReturnType<
	typeof createReduxStore< State, typeof privateActions, typeof selectors >
> = createReduxStore< State, typeof privateActions, typeof selectors >(
	STORE_NAME,
	storeConfig
);

unlock( store ).registerPrivateActions( privateActions );
register( store );
