#!/usr/bin/env node
const fs = require( 'fs' );
const path = require( 'path' );
const {
	generateHistoricalChangelogTree,
} = require( './lib/historical-changelog-generator' );

/**
 * Fails closed on an invalid command or output target.
 *
 * @param {boolean} condition Whether the invariant is satisfied.
 * @param {string}  message   Failure message.
 */
function invariant( condition, message ) {
	if ( ! condition ) {
		throw new Error( message );
	}
}

/**
 * Parses the generator's deliberately small CLI surface.
 *
 * @param {string[]} args Arguments.
 * @return {Object} Options.
 */
function parseArgs( args ) {
	const options = {
		repositoryPath: process.cwd(),
		ledgerPath: null,
		outputDirectory: null,
		writeWorktree: false,
		reportPath: null,
	};
	for ( let index = 0; index < args.length; index++ ) {
		const argument = args[ index ];
		const value = args[ index + 1 ];
		if ( argument === '--repository-path' ) {
			invariant( value, '--repository-path requires a value' );
			options.repositoryPath = path.resolve( value );
			index++;
		} else if ( argument === '--ledger' ) {
			invariant( value, '--ledger requires a value' );
			options.ledgerPath = path.resolve( value );
			index++;
		} else if ( argument === '--output-directory' ) {
			invariant( value, '--output-directory requires a value' );
			options.outputDirectory = path.resolve( value );
			index++;
		} else if ( argument === '--write' ) {
			options.writeWorktree = true;
		} else if ( argument === '--report' ) {
			invariant( value, '--report requires a value' );
			options.reportPath = path.resolve( value );
			index++;
		} else {
			throw new Error( `Unknown argument: ${ argument }` );
		}
	}
	invariant( options.ledgerPath, '--ledger is required' );
	invariant(
		Number( Boolean( options.outputDirectory ) ) +
			Number( options.writeWorktree ) ===
			1,
		'Choose exactly one of --output-directory or --write'
	);
	return options;
}

/**
 * Writes only generated changelog files. Existing bytes must be either the
 * frozen baseline or the exact generated result, which makes a second run a
 * no-op and prevents overwriting unrelated work.
 *
 * @param {Object}  options               Write options.
 * @param {string}  options.outputRoot    Output root.
 * @param {boolean} options.writeWorktree Whether this is the repository tree.
 * @param {Object}  options.generated     Generation result.
 * @return {Object} Write summary.
 */
function writeGeneratedFiles( { outputRoot, writeWorktree, generated } ) {
	fs.mkdirSync( outputRoot, { recursive: true } );
	let writtenFileCount = 0;
	let unchangedFileCount = 0;
	for ( const record of generated.fileRecords ) {
		const target = path.resolve( outputRoot, record.filePath );
		invariant(
			target.startsWith( `${ outputRoot }${ path.sep }` ),
			`Generated path escapes output root: ${ record.filePath }`
		);
		const baseline = generated.baselineByPath.get( record.filePath );
		const expected = generated.generatedByPath.get( record.filePath );
		const existing = fs.existsSync( target )
			? fs.readFileSync( target, 'utf8' )
			: null;
		if ( existing === expected ) {
			unchangedFileCount++;
			continue;
		}
		invariant(
			existing === null || existing === baseline,
			`${ writeWorktree ? 'Worktree' : 'Output' } file ${
				record.filePath
			} differs from both the frozen baseline and generated result`
		);
		fs.mkdirSync( path.dirname( target ), { recursive: true } );
		fs.writeFileSync( target, expected, 'utf8' );
		writtenFileCount++;
	}
	return {
		outputRoot,
		writtenFileCount,
		unchangedFileCount,
		idempotent: writtenFileCount === 0,
	};
}

function main() {
	const options = parseArgs( process.argv.slice( 2 ) );
	let ledger;
	try {
		ledger = JSON.parse( fs.readFileSync( options.ledgerPath, 'utf8' ) );
	} catch ( error ) {
		throw new Error(
			`Could not read ledger from ${ options.ledgerPath }: ${ error.message }`
		);
	}
	const generated = generateHistoricalChangelogTree( {
		repositoryPath: options.repositoryPath,
		ledger,
	} );
	const write = writeGeneratedFiles( {
		outputRoot: options.writeWorktree
			? options.repositoryPath
			: options.outputDirectory,
		writeWorktree: options.writeWorktree,
		generated,
	} );
	const report = {
		schemaVersion: 1,
		baselineSha: generated.baselineSha,
		ledgerIntegrityHash: generated.ledgerIntegrityHash,
		generatorIntegrityHash: generated.integrityHash,
		verification: generated.verification,
		write,
		files: generated.fileRecords,
		operations: [ ...generated.traces.values() ],
		destinationSectionCreations: generated.destinationSectionCreations,
	};
	if ( options.reportPath ) {
		fs.writeFileSync(
			options.reportPath,
			`${ JSON.stringify( report, null, '\t' ) }\n`,
			'utf8'
		);
	}
	process.stdout.write(
		`${ JSON.stringify(
			{
				baselineSha: report.baselineSha,
				ledgerIntegrityHash: report.ledgerIntegrityHash,
				generatorIntegrityHash: report.generatorIntegrityHash,
				verification: report.verification,
				write: report.write,
			},
			null,
			'\t'
		) }\n`
	);
}

if ( require.main === module ) {
	try {
		main();
	} catch ( error ) {
		console.error(
			error instanceof Error ? error.message : String( error )
		);
		process.exitCode = 1;
	}
}

module.exports = { parseArgs, writeGeneratedFiles };
