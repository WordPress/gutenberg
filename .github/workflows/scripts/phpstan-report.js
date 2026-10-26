/**
 * Reports the errors in a PHPStan JSON report as annotations and in the job
 * summary, and fails when there are any.
 *
 * PHPStan writes the report as JSON rather than in its `github` format, since it
 * can only produce one format per run, so this script prints the annotations
 * that format would have, and additionally lists every error in the job summary.
 *
 * An annotation is only shown alongside the changes in a pull request when its
 * line is part of the diff, and GitHub shows at most ten error annotations per
 * step. An error on a line the pull request did not change, or one with no line
 * at all, is otherwise easy to miss: it is only listed with the run's
 * annotations, or not at all past the tenth. The job summary lists every error,
 * and explains the most common of those: a baseline entry that no longer
 * matches, because the error it recorded was fixed.
 *
 * Usage:
 *
 *     node phpstan-report.js <report.json>
 *
 * The report is the output of `phpstan analyse --error-format=json`.
 */

const fs = require( 'node:fs' );

const {
	GITHUB_REPOSITORY,
	GITHUB_SERVER_URL,
	GITHUB_SHA,
	GITHUB_STEP_SUMMARY,
	GITHUB_WORKSPACE,
} = process.env;

/**
 * Whether an error means a baseline entry records more occurrences of an error
 * than there are now, because some were fixed. Regenerating the baseline fixes
 * it.
 *
 * @param {PhpstanError} error The error.
 * @return {boolean} Whether the baseline entry is stale.
 */
function isStaleBaselineEntry( error ) {
	return (
		error.identifier === 'ignore.unmatched' ||
		( error.identifier === 'ignore.count' &&
			error.message.includes( ', but occurred only ' ) )
	);
}

/**
 * Whether an error means a baseline entry records fewer occurrences of an error
 * than there are now, because more were added. Regenerating the baseline would
 * record the new ones too, so they should be fixed instead.
 *
 * @param {PhpstanError} error The error.
 * @return {boolean} Whether the baseline entry is exceeded.
 */
function isExceededBaselineEntry( error ) {
	return (
		error.identifier === 'ignore.count' && ! isStaleBaselineEntry( error )
	);
}

// GitHub shows at most this many error annotations per step.
const ANNOTATION_LIMIT = 10;

/*
 * The job summary lists at most this many errors. GitHub drops a summary larger
 * than 1 MiB entirely, which thousands of errors, such as after a PHPStan
 * upgrade, could otherwise exceed.
 */
const SUMMARY_LIMIT = 500;

/**
 * @typedef {Object} PhpstanError
 * @property {string|null} file       Path relative to the workspace, if any.
 * @property {number|null} line       Line number, if any.
 * @property {string}      message    Error message.
 * @property {string|null} identifier Error identifier, if any.
 * @property {string|null} tip        Tip shown with the error, if any.
 */

/**
 * Escapes the message of a workflow command.
 *
 * @param {string} value The message.
 * @return {string} The escaped message.
 */
function escapeData( value ) {
	return value
		.replace( /%/g, '%25' )
		.replace( /\r/g, '%0D' )
		.replace( /\n/g, '%0A' );
}

/**
 * Escapes a property value of a workflow command.
 *
 * @param {string} value The property value.
 * @return {string} The escaped property value.
 */
function escapeProperty( value ) {
	return escapeData( value ).replace( /:/g, '%3A' ).replace( /,/g, '%2C' );
}

/**
 * Escapes text for inclusion in HTML.
 *
 * @param {string} value The text.
 * @return {string} The escaped text.
 */
function escapeHtml( value ) {
	return value
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' );
}

/**
 * Reads the errors from a PHPStan JSON report.
 *
 * @param {string} reportPath Path to the report.
 * @return {PhpstanError[]|null} The errors, or null if the report could not be read.
 */
function readErrors( reportPath ) {
	let report;
	try {
		report = JSON.parse( fs.readFileSync( reportPath, 'utf8' ) );
	} catch {
		// PHPStan also exits with 1 when it cannot load the configuration, writing to stderr only.
		return null;
	}
	const workspace = `${ GITHUB_WORKSPACE || process.cwd() }/`;

	/*
	 * Errors that are not specific to a file come first, so that the limits on
	 * annotations and summary rows never drop them. They are about the run
	 * itself, such as an internal error, and are the hardest to find otherwise.
	 */
	/** @type {PhpstanError[]} */
	const errors = report.errors.map( ( message ) => ( {
		file: null,
		line: null,
		message,
		identifier: null,
		tip: null,
	} ) );

	for ( const [ key, file ] of Object.entries( report.files ) ) {
		// An error in a trait is keyed by the trait's file, followed by the class it was analyzed in.
		const absolutePath = key.replace( / \(in context of .+\)$/, '' );
		const relativePath = absolutePath.startsWith( workspace )
			? absolutePath.slice( workspace.length )
			: absolutePath;
		for ( const message of file.messages ) {
			errors.push( {
				file: relativePath,
				line: message.line ?? null,
				message: message.message,
				identifier: message.identifier ?? null,
				tip: message.tip ?? null,
			} );
		}
	}

	return errors;
}

/**
 * Prints an error annotation for each error.
 *
 * @param {PhpstanError[]} errors The errors.
 */
function annotate( errors ) {
	for ( const error of errors ) {
		const properties = [
			`title=${ escapeProperty(
				error.identifier ? `PHPStan: ${ error.identifier }` : 'PHPStan'
			) }`,
		];
		if ( error.file ) {
			properties.push( `file=${ escapeProperty( error.file ) }` );
		}
		if ( error.line ) {
			properties.push( `line=${ error.line }` );
		}
		const message = error.tip
			? `${ error.message }\n${ error.tip }`
			: error.message;
		process.stdout.write(
			`::error ${ properties.join( ',' ) }::${ escapeData( message ) }\n`
		);
	}
}

/**
 * Formats the location of an error, linked to the analyzed commit.
 *
 * @param {PhpstanError} error The error.
 * @return {string} The location as HTML.
 */
function formatLocation( error ) {
	if ( ! error.file ) {
		return '';
	}
	const location = error.line
		? `${ error.file }:${ error.line }`
		: error.file;
	if ( ! GITHUB_SERVER_URL || ! GITHUB_REPOSITORY || ! GITHUB_SHA ) {
		return `<code>${ escapeHtml( location ) }</code>`;
	}
	const url = `${ GITHUB_SERVER_URL }/${ GITHUB_REPOSITORY }/blob/${ GITHUB_SHA }/${ error.file }${
		error.line ? `#L${ error.line }` : ''
	}`;
	return `<a href="${ escapeHtml( url ) }"><code>${ escapeHtml(
		location
	) }</code></a>`;
}

/**
 * Builds the job summary.
 *
 * @param {PhpstanError[]} errors The errors.
 * @return {string} The summary as Markdown.
 */
function buildSummary( errors ) {
	if ( errors.length === 0 ) {
		return '## PHPStan\n\nNo errors were found.\n';
	}

	const sections = [
		`## PHPStan found ${ errors.length } ${
			errors.length === 1 ? 'error' : 'errors'
		}`,
	];

	if ( errors.some( isStaleBaselineEntry ) ) {
		sections.push(
			'### The baseline is out of date',
			'An entry in `tools/phpstan/baseline.neon` records an error that now occurs fewer times, or not at all.'
		);
		if (
			errors.some(
				( error ) =>
					! isStaleBaselineEntry( error ) &&
					! isExceededBaselineEntry( error )
			)
		) {
			// Regenerating now would record those errors in the baseline.
			sections.push(
				'This run also reports other errors, which are listed below. **Fix those first**, since regenerating the baseline would record them as accepted errors. When a pull request changes a line with a baselined error, the error can also come back as a new one with a different message, so that its baseline entry no longer matches: fix it rather than regenerating the baseline. Once only out-of-date entries are left, regenerate the baseline and commit the result.'
			);
		} else {
			sections.push(
				'**If this pull request fixed one of them, this is expected**, and there is nothing to change in the code: regenerate the baseline and commit the result.'
			);
		}
		sections.push(
			'```bash\ncomposer phpstan:baselines\n```',
			'or, in the local environment:',
			'```bash\nnpm run typecheck:php:baselines\n```'
		);
	}

	if ( errors.some( isExceededBaselineEntry ) ) {
		sections.push(
			'### A baselined error occurs more often',
			'An entry in `tools/phpstan/baseline.neon` records an error that now occurs more times than it records, which usually means this pull request added another occurrence. The occurrences past the recorded number are listed below as errors of their own, although PHPStan cannot tell which of them is the new one. **Fix the new occurrence rather than regenerating the baseline**, which would record it as an accepted error.'
		);
	}

	const rows = errors
		.slice( 0, SUMMARY_LIMIT )
		.map(
			( error ) =>
				`<tr><td>${ formatLocation( error ) }</td><td>${
					error.identifier
						? `<code>${ escapeHtml( error.identifier ) }</code>`
						: ''
				}</td><td>${ escapeHtml( error.message ) }${
					error.tip ? `<br><em>${ escapeHtml( error.tip ) }</em>` : ''
				}</td></tr>`
		);
	sections.push(
		'### Errors',
		`<table><thead><tr><th>Location</th><th>Identifier</th><th>Message</th></tr></thead><tbody>${ rows.join(
			''
		) }</tbody></table>`
	);
	if ( errors.length > SUMMARY_LIMIT ) {
		sections.push(
			`…and ${
				errors.length - SUMMARY_LIMIT
			} more, which are listed in the output of this step.`
		);
	}

	if ( errors.length > ANNOTATION_LIMIT ) {
		sections.push(
			`Only the first ${ ANNOTATION_LIMIT } errors are shown as annotations on the pull request.`
		);
	}

	sections.push(
		'To run the analysis locally, run `npm run build` and then `composer phpstan`, or `npm run typecheck:php` in the local environment.'
	);

	return sections.join( '\n\n' ) + '\n';
}

const reportPath = process.argv[ 2 ];
if ( ! reportPath ) {
	process.stderr.write( 'Usage: node phpstan-report.js <report.json>\n' );
	process.exit( 2 );
}

const errors = readErrors( reportPath );
if ( errors === null ) {
	process.stdout.write(
		'::error title=PHPStan did not complete::The report is missing or is not valid JSON, so the code was not checked. See the output of the previous step for the reason.\n'
	);
	if ( GITHUB_STEP_SUMMARY ) {
		fs.appendFileSync(
			GITHUB_STEP_SUMMARY,
			'## PHPStan did not complete\n\nThe report is missing or is not valid JSON, so the code was not checked. See the output of the “Run PHPStan” step for the reason, such as an error in the configuration.\n'
		);
	}
	process.exit( 1 );
}
annotate( errors );
if ( GITHUB_STEP_SUMMARY ) {
	fs.appendFileSync( GITHUB_STEP_SUMMARY, buildSummary( errors ) );
}
process.exitCode = errors.length > 0 ? 1 : 0;
