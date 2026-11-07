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
 * Usage: `npm run --workspace @wordpress/phpstan-tools report -- <report.json>`
 *
 * The report is the output of `phpstan analyse --error-format=json`.
 */

import { appendFileSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const {
	GITHUB_REPOSITORY,
	GITHUB_SERVER_URL,
	GITHUB_SHA,
	GITHUB_STEP_SUMMARY,
	GITHUB_WORKSPACE,
	INIT_CWD,
} = process.env;

/*
 * `npm run` runs the script in the workspace directory, so the paths in the
 * report are made relative to the repository root, and a relative path to the
 * report is resolved from the directory that npm was run in.
 */
const REPOSITORY_ROOT =
	GITHUB_WORKSPACE || resolve( import.meta.dirname, '../..' );
const INVOCATION_DIRECTORY = INIT_CWD || process.cwd();

/**
 * An error that PHPStan reported.
 */
interface PhpstanError {
	/** Path relative to the workspace, if any. */
	file: string | null;
	/** Line number, if any. */
	line: number | null;
	/** Error message. */
	message: string;
	/** Error identifier, if any. */
	identifier: string | null;
	/** Tip shown with the error, if any. */
	tip: string | null;
	/** Whether running PHPStan with `--fix` fixes the error. */
	fixable: boolean;
}

/**
 * An error in a file, as a report written by `phpstan analyse
 * --error-format=json` has it.
 */
interface PhpstanReportMessage {
	message: string;
	line?: number | null;
	identifier?: string;
	tip?: string;
	fixable?: boolean;
}

/**
 * The part of a report written by `phpstan analyse --error-format=json` that
 * this script reads.
 */
interface PhpstanReport {
	/** Errors that are not specific to a file. */
	errors: string[];
	/** Errors per file, keyed by the file's absolute path. */
	files: Record< string, { messages: PhpstanReportMessage[] } >;
}

/**
 * Whether an error means a baseline entry records more occurrences of an error
 * than there are now, because some were fixed. Running PHPStan with `--fix`
 * fixes it.
 *
 * @param error The error.
 * @return Whether the baseline entry is stale.
 */
function isStaleBaselineEntry( error: PhpstanError ): boolean {
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
 * @param error The error.
 * @return Whether the baseline entry is exceeded.
 */
function isExceededBaselineEntry( error: PhpstanError ): boolean {
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

// Added to the annotation of an error that PHPStan can fix itself, such as an out-of-date baseline entry.
const FIX_HINT =
	'This can be fixed automatically by running `composer phpstan -- --fix` (or `npm run typecheck:php -- --fix`).';

/**
 * Escapes the message of a workflow command.
 *
 * @param value The message.
 * @return The escaped message.
 */
function escapeData( value: string ): string {
	return value
		.replace( /%/g, '%25' )
		.replace( /\r/g, '%0D' )
		.replace( /\n/g, '%0A' );
}

/**
 * Escapes a property value of a workflow command.
 *
 * @param value The property value.
 * @return The escaped property value.
 */
function escapeProperty( value: string ): string {
	return escapeData( value ).replace( /:/g, '%3A' ).replace( /,/g, '%2C' );
}

/**
 * Escapes text for inclusion in HTML.
 *
 * @param value The text.
 * @return The escaped text.
 */
function escapeHtml( value: string ): string {
	return value
		.replace( /&/g, '&amp;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' )
		.replace( /"/g, '&quot;' );
}

/**
 * Reads the errors from a PHPStan JSON report.
 *
 * @param reportPath Path to the report.
 * @return The errors, or null if the report could not be read.
 */
function readErrors( reportPath: string ): PhpstanError[] | null {
	let report: PhpstanReport;
	try {
		report = JSON.parse( readFileSync( reportPath, 'utf8' ) );
	} catch {
		// PHPStan also exits with 1 when it cannot load the configuration, writing to stderr only.
		return null;
	}
	const workspace = `${ REPOSITORY_ROOT }/`;

	/*
	 * Errors that are not specific to a file come first, so that the limits on
	 * annotations and summary rows never drop them. They are about the run
	 * itself, such as an internal error, and are the hardest to find otherwise.
	 */
	const errors: PhpstanError[] = report.errors.map( ( message ) => ( {
		file: null,
		line: null,
		message,
		identifier: null,
		tip: null,
		fixable: false,
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
				fixable: message.fixable ?? false,
			} );
		}
	}

	return errors;
}

/**
 * Prints an error annotation for each error.
 *
 * @param errors The errors.
 */
function annotate( errors: PhpstanError[] ): void {
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
		const message = [
			error.message,
			error.tip,
			error.fixable ? FIX_HINT : null,
		]
			.filter( Boolean )
			.join( '\n' );
		process.stdout.write(
			`::error ${ properties.join( ',' ) }::${ escapeData( message ) }\n`
		);
	}
}

/**
 * Formats the location of an error, linked to the analyzed commit.
 *
 * @param error The error.
 * @return The location as HTML.
 */
function formatLocation( error: PhpstanError ): string {
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
 * @param errors The errors.
 * @return The summary as Markdown.
 */
function buildSummary( errors: PhpstanError[] ): string {
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
		sections.push(
			'**If this pull request fixed one of them, this is expected**, and there is nothing to change in the code: remove the out-of-date entries by running PHPStan with `--fix`, and commit the result.',
			'```bash\ncomposer phpstan -- --fix\n```',
			'or, in the local environment:',
			'```bash\nnpm run typecheck:php -- --fix\n```'
		);
		if (
			errors.some(
				( error ) =>
					! isStaleBaselineEntry( error ) &&
					! isExceededBaselineEntry( error )
			)
		) {
			/*
			 * `--fix` only lowers or removes baseline entries, whereas regenerating
			 * the baseline now would record those errors in it.
			 */
			sections.push(
				'This run also reports other errors, which are listed below, and which still need to be fixed. `--fix` leaves them reported, but **do not regenerate the baseline** with `composer phpstan:baselines` until they are fixed, since that would record them as accepted errors. When a pull request changes a line with a baselined error, the error can also come back as a new one with a different message, so that its baseline entry no longer matches: fix the new error rather than baselining it.'
			);
		}
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
					error.fixable ? ' 🔧' : ''
				}${
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

	if ( errors.some( ( error ) => error.fixable ) ) {
		sections.push(
			'Errors marked with 🔧 can be fixed automatically by running PHPStan with `--fix`.'
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
	process.stderr.write(
		'Usage: npm run --workspace @wordpress/phpstan-tools report -- <report.json>\n'
	);
	process.exit( 2 );
}

const errors = readErrors( resolve( INVOCATION_DIRECTORY, reportPath ) );
if ( errors === null ) {
	process.stdout.write(
		'::error title=PHPStan did not complete::The report is missing or is not valid JSON, so the code was not checked. See the output of the previous step for the reason.\n'
	);
	if ( GITHUB_STEP_SUMMARY ) {
		appendFileSync(
			GITHUB_STEP_SUMMARY,
			'## PHPStan did not complete\n\nThe report is missing or is not valid JSON, so the code was not checked. See the output of the “Run PHPStan” step for the reason, such as an error in the configuration.\n'
		);
	}
	process.exit( 1 );
}
annotate( errors );
if ( GITHUB_STEP_SUMMARY ) {
	appendFileSync( GITHUB_STEP_SUMMARY, buildSummary( errors ) );
}
process.exitCode = errors.length > 0 ? 1 : 0;
