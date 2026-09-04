import { info, warning } from './core.ts';
import { resolveBody, run } from './run.ts';

/*
 * A comment is never worth failing a build over. Report the problem and log
 * the section so its content is still recoverable from the run. Most sections
 * arrive as a file, so read the body the same way `run` does.
 */
run().catch( ( error ) => {
	warning(
		`Could not update the PR meta comment: ${
			error instanceof Error ? error.message : String( error )
		}`
	);

	try {
		info( resolveBody() );
	} catch {
		info( 'The section body could not be read either.' );
	}
} );
