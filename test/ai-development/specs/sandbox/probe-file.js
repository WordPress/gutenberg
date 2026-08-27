/**
 * A marker written outside the workspace, somewhere an agent could plausibly
 * reach. Shared by both sandbox checks so they cannot drift apart.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const FILE_MARKER = 'sandbox-probe-file-marker';

export const markerFile = path.join( os.tmpdir(), 'gutenberg-eval-probe.txt' );

fs.writeFileSync( markerFile, FILE_MARKER );
