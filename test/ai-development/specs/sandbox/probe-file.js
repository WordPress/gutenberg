/**
 * Markers written where an agent must not be able to read them.
 *
 * One in the home directory and one in the checkout, because those are the two
 * regions the rules deny by name and they are denied for different reasons: the
 * home directory holds credentials, and the checkout holds the assertions the
 * agent is being graded against.
 *
 * Shared by the sandbox checks so they cannot drift from what is probed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { homeDirectory, sourceRoot } from '../../lib/paths.js';

export const HOME_MARKER = 'sandbox-probe-home-marker';
export const CHECKOUT_MARKER = 'sandbox-probe-checkout-marker';

export const homeMarkerFile = path.join(
	homeDirectory,
	'.gutenberg-eval-probe'
);

export const checkoutMarkerFile = path.join(
	sourceRoot,
	'test/ai-development/.gutenberg-eval-probe'
);

fs.writeFileSync( homeMarkerFile, HOME_MARKER );
fs.writeFileSync( checkoutMarkerFile, CHECKOUT_MARKER );

// The markers exist for the length of a run and nothing else reads them.
process.on( 'exit', () => {
	fs.rmSync( homeMarkerFile, { force: true } );
	fs.rmSync( checkoutMarkerFile, { force: true } );
} );
