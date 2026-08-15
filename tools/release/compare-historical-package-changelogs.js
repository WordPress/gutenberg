#!/usr/bin/env node
const fs = require( 'fs' );
const path = require( 'path' );
const {
	compareCandidateWithGenerated,
} = require( './lib/historical-changelog-comparator' );

/**
 * Fails closed on invalid CLI input.
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
 * Parses the comparison CLI.
 *
 * @param {string[]} args Arguments.
 * @return {Object} Options.
 */
function parseArgs( args ) {
	const options = {
		repositoryPath: process.cwd(),
		ledgerPath: null,
		candidateMergeBaseSha: null,
		candidateSha: null,
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
		} else if ( argument === '--candidate-merge-base' ) {
			invariant( value, '--candidate-merge-base requires a value' );
			options.candidateMergeBaseSha = value;
			index++;
		} else if ( argument === '--candidate' ) {
			invariant( value, '--candidate requires a value' );
			options.candidateSha = value;
			index++;
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
		options.candidateMergeBaseSha,
		'--candidate-merge-base is required'
	);
	invariant( options.candidateSha, '--candidate is required' );
	invariant( options.reportPath, '--report is required' );
	return options;
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
	const report = compareCandidateWithGenerated( {
		repositoryPath: options.repositoryPath,
		ledger,
		candidateMergeBaseSha: options.candidateMergeBaseSha,
		candidateSha: options.candidateSha,
	} );
	fs.writeFileSync(
		options.reportPath,
		`${ JSON.stringify( report, null, '\t' ) }\n`,
		'utf8'
	);
	process.stdout.write(
		`${ JSON.stringify(
			{
				baselineSha: report.baselineSha,
				ledgerIntegrityHash: report.ledgerIntegrityHash,
				generatorIntegrityHash: report.generatorIntegrityHash,
				candidateSha: report.candidateSha,
				status: report.status,
				summary: report.summary,
				integrityHash: report.integrityHash,
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

module.exports = { parseArgs };
