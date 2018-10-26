/**
 * @format
 * @flow
 */

// Gutenberg imports
import { serialize } from '@wordpress/blocks';

import ActionTypes from './actions/ActionTypes';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';
export default ( store ) => ( next ) => ( action ) => {
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
