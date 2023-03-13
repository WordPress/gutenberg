/**
 * External dependencies
 */
import * as core from '@actions/core';

/**
 * Internal dependencies
 */
import { run } from './run';

run().catch( ( error ) => {
	core.error( error instanceof Error ? error : String( error ) );
} );
