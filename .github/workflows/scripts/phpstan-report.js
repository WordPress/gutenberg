/**
 * Reports the errors in a PHPStan JSON report as annotations and in the job
 * summary, and fails when there are any.
 *
 * An annotation is only shown alongside the changes in a pull request when its
 * line is part of the diff, and GitHub shows at most ten error annotations per
 * step. An error on a line the pull request did not change, or one with no line
 * at all, would otherwise only be found in the log. The job summary lists every
 * error, and explains the most common of those: a baseline entry that no longer
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

/*
 * The identifiers of the errors that mean the baseline is out of date: an entry
 * that matches no error, or that matches a different number of them than it
 * records. Both are fixed by regenerating the baseline.
 */
const BASELINE_IDENTIFIERS = [ 'ignore.unmatched', 'ignore.count' ];

// GitHub shows at most this many error annotations per step.
const ANNOTATION_LIMIT = 10;

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
 * @return {PhpstanError[]} The errors.
 */
function readErrors( reportPath ) {
	const report = JSON.parse( fs.readFileSync( reportPath, 'utf8' ) );
	const workspace = `${ GITHUB_WORKSPACE || process.cwd() }/`;

	/** @type {PhpstanError[]} */
	const errors = [];
	for ( const [ absolutePath, file ] of Object.entries( report.files ) ) {
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

	// Errors that are not specific to a file.
	for ( const message of report.errors ) {
		errors.push( {
			file: null,
			line: null,
			message,
			identifier: null,
			tip: null,
		} );
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

	const baselineErrors = errors.filter( ( error ) =>
		BASELINE_IDENTIFIERS.includes( error.identifier )
	);
	if ( baselineErrors.length > 0 ) {
		sections.push(
			'### The baseline is out of date',
			'An entry in `tools/phpstan/baseline.neon` no longer matches the errors it records. **If this pull request fixed one of them, this is expected**, and there is nothing to change in the code: regenerate the baseline and commit the result.',
			'```bash\ncomposer phpstan:baselines\n```',
			'or, in the local environment:',
			'```bash\nnpm run typecheck:php:baselines\n```'
		);
	}

	const rows = errors.map(
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
annotate( errors );
if ( GITHUB_STEP_SUMMARY ) {
	fs.appendFileSync( GITHUB_STEP_SUMMARY, buildSummary( errors ) );
}
process.exitCode = errors.length > 0 ? 1 : 0;
