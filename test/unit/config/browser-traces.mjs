import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';

/**
 * Record each Browser Mode file and retain failures and unhandled errors.
 * Per-file traces avoid copying network data for every test and using long or
 * duplicate test titles as filenames in Vitest's native per-test tracing.
 *
 * @param {string} rootDir Repository root.
 * @return {Object} Browser commands and their lifecycle reporter.
 */
export function createBrowserTraceArtifacts( rootDir ) {
	const tracesDir = path.join(
		rootDir,
		'test-results/vitest-browser-traces'
	);
	const contexts = new Map();

	async function finishTrace( testPath, failed ) {
		const context = contexts.get( testPath );
		if ( ! context ) {
			return;
		}
		contexts.delete( testPath );
		const tracePath = path.join(
			tracesDir,
			`${ path.relative( rootDir, testPath ) }.trace.zip`
		);
		if ( failed ) {
			await mkdir( path.dirname( tracePath ), { recursive: true } );
		}
		await context.tracing.stop( failed ? { path: tracePath } : undefined );
		if ( failed ) {
			process.stdout.write(
				`Browser trace: ${ path.relative( rootDir, tracePath ) }\n`
			);
		}
	}

	return {
		commands: {
			async startBrowserTrace( { context, testPath } ) {
				// Workers reuse their context across isolated test iframes. Keep
				// any unfinished recording before starting the next file's trace.
				for ( const [ previousPath, previousContext ] of contexts ) {
					if ( previousContext === context ) {
						await finishTrace( previousPath, true );
						break;
					}
				}
				await context.tracing.start( {
					title: path.relative( rootDir, testPath ),
					screenshots: true,
					snapshots: true,
					sources: true,
				} );
				contexts.set( testPath, context );
			},
		},
		reporter: {
			async onTestRunStart() {
				await rm( tracesDir, { recursive: true, force: true } );
			},
			async onTestModuleEnd( testModule ) {
				// Unhandled browser errors fail the run without failing the module.
				const hasUnhandledError = testModule.project.vitest.state
					.getUnhandledErrors()
					.some(
						( error ) =>
							error?.VITEST_TEST_PATH === testModule.moduleId
					);
				await finishTrace(
					testModule.moduleId,
					testModule.state() === 'failed' || hasUnhandledError
				);
			},
			async onTestRunEnd() {
				// Keep diagnostics for interrupted files and collection failures too.
				await Promise.all(
					[ ...contexts.keys() ].map( ( testPath ) =>
						finishTrace( testPath, true )
					)
				);
			},
		},
	};
}
