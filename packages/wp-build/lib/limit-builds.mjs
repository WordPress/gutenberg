/**
 * Concurrency limit for esbuild builds.
 *
 * @package
 */
import os from 'node:os';
import esbuild from 'esbuild';

const maxActiveBuilds = Math.ceil( os.availableParallelism() / 2 );
let activeBuilds = 0;
/** @type {Array<( value?: unknown ) => void>} */
const waitingBuilds = [];

/**
 * Runs `esbuild.build()`, waiting while half as many builds as there are
 * available CPU cores are running.
 *
 * @param {import('esbuild').BuildOptions} options esbuild build options.
 * @return {Promise<import('esbuild').BuildResult>} The build result.
 */
export async function limitedBuild( options ) {
	if ( activeBuilds < maxActiveBuilds ) {
		activeBuilds++;
	} else {
		await new Promise( ( resolve ) => waitingBuilds.push( resolve ) );
	}
	try {
		return await esbuild.build( options );
	} finally {
		// A finished build passes its slot to the next waiting build.
		const next = waitingBuilds.shift();
		if ( next ) {
			next();
		} else {
			activeBuilds--;
		}
	}
}
