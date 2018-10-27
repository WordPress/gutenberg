/**
 * @format
 * @flow
 */

// Gutenberg imports
import { serialize } from '@wordpress/blocks';

import type { Store, Dispatch } from 'redux';

import ActionTypes from './actions/ActionTypes';
import type { BlockActionType } from './actions';

import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';
export default ( store: Store ) => ( next: Dispatch ) => ( action: BlockActionType ) => {
	switch ( action.type ) {
		case ActionTypes.BLOCK.SERIALIZE_ALL: {
			const html = store
				.getState()
				.blocks.map( serialize )
				.join( '\n\n' );
			RNReactNativeGutenbergBridge.provideToNative_Html( html );
		}
	}

	return next( action );
};
