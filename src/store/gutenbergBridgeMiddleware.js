/**
 * @format
 * @flow
 */

import md5 from 'md5';

import { store2html } from './utils';

import type { Store, Dispatch } from 'redux';

import ActionTypes from './actions/ActionTypes';
import type { BlockActionType } from './actions';

import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';
export default ( store: Store ) => ( next: Dispatch ) => ( action: BlockActionType ) => {
	switch ( action.type ) {
		case ActionTypes.BLOCK.SERIALIZE_ALL: {
			const html = store2html( store );
			const hash = md5( html );
			const oldHash = store.getState().initialHtmlHash;
			RNReactNativeGutenbergBridge.provideToNative_Html( html, oldHash !== hash );
		}
	}

	return next( action );
};
