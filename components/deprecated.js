/**
 * External dependencies
 */
import { mapValues } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	ifCondition,
	withGlobalEvents,
	withInstanceId,
	withSafeTimeout,
	withState,
} from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

const deprecatedFunctions = {
	ifCondition,
	withGlobalEvents,
	withInstanceId,
	withSafeTimeout,
	withState,
};

export default mapValues( deprecatedFunctions, ( deprecatedFunction, key ) => {
	return ( ...args ) => {
		deprecated( 'wp.components.' + key, {
			version: '3.5',
			alternative: 'wp.compose.' + key,
		} );

		return deprecatedFunction( ...args );
	};
} );
