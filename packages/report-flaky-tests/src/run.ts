import * as fs from 'fs/promises';
import * as path from 'path';
import * as core from '@actions/core';
import { formatTestErrorMessage, renderReport } from './markdown.ts';
import type { FlakyTestResult, ReportedFlakyTest } from './types.ts';

async function run() {
	const artifactPath = core.getInput( 'artifact-path', { required: true } );

	/*
	 * A clean run produces no artifact at all, which is the ordinary case. Any
	 * other failure has to surface: reporting it as clean would clear a report
	 * that nothing had disproved.
	 */
	const flakyTestsDir = await fs.readdir( artifactPath ).catch( ( error ) => {
		if ( error.code === 'ENOENT' ) {
			return [] as string[];
		}
		throw error;
	} );

	/*
	 * A report that can't be parsed (e.g. a partially written file) must not
	 * prevent the remaining flaky tests from being reported.
	 */
	const flakyTests = (
		await Promise.all(
			flakyTestsDir
				.filter( ( filename ) => filename.endsWith( '.json' ) )
				.map( async ( filename ) => {
					try {
						const text = await fs.readFile(
							path.join( artifactPath, filename ),
							'utf-8'
						);
						return JSON.parse( text ) as FlakyTestResult;
					} catch ( error ) {
						core.warning(
							`Skipping unreadable flaky test report "${ filename }": ${
								error instanceof Error
									? error.message
									: String( error )
							}`
						);
						return null;
					}
				} )
		)
	).filter( ( result ): result is FlakyTestResult => result !== null );

	if ( flakyTests.length === 0 ) {
		core.info( 'No flaky tests to report.' );
		return;
	}

	const reportedTests: ReportedFlakyTest[] = flakyTests.map(
		( flakyTest ) => ( {
			testTitle: flakyTest.title,
			testPath: flakyTest.path.startsWith( process.cwd() )
				? flakyTest.path.slice( process.cwd().length )
				: flakyTest.path,
			failedTimes: flakyTest.results.length,
			errorMessage: formatTestErrorMessage( flakyTest ),
		} )
	);

	const outputPath = core.getInput( 'output-path', { required: true } );

	await fs.mkdir( path.dirname( outputPath ), { recursive: true } );
	await fs.writeFile(
		outputPath,
		renderReport( { reportedTests } ),
		'utf-8'
	);

	core.info( `Wrote a report of ${ reportedTests.length } flaky tests.` );
}

export { run };
