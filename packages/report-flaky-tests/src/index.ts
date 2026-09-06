import * as core from '@actions/core';
import { run } from './run.ts';

/*
 * Fail the step rather than logging. A green step with no report is how a
 * clean run looks, so swallowing an error here would clear a flaky report
 * that nothing had disproved.
 */
run().catch( ( error ) => {
	core.setFailed( error instanceof Error ? error.message : String( error ) );
} );
