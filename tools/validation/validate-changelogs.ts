#!/usr/bin/env node
/**
 * Validates package CHANGELOG.md Unreleased sections.
 *
 * Usage:
 *   node tools/validation/validate-changelogs.ts [path ...]
 *   node tools/validation/validate-changelogs.ts --pr=12345 packages/foo/CHANGELOG.md
 *   node tools/validation/validate-changelogs.ts --require-pr=12345 packages/foo/CHANGELOG.md
 *
 * With no paths, validates every package CHANGELOG under `packages/`.
 * `--pr` flags a link to that pull request that sits outside Unreleased.
 * `--require-pr` also requires Unreleased to cite that pull request.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs as parseNodeArgs } from 'node:util';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const REPO_ROOT = resolve( __dirname, '../..' );

/**
 * `npm run --workspace` sets cwd to this package. Prefer the directory
 * where npm was invoked; otherwise treat paths as repo-root-relative.
 *
 * @param inputPath     Changelog path from the CLI.
 * @param fromDirectory Directory to resolve relative paths from.
 */
export function resolveChangelogPath(
	inputPath: string,
	fromDirectory: string = process.env.INIT_CWD || REPO_ROOT
): string {
	return resolve( fromDirectory, inputPath );
}

/**
 * Section titles allowed under ## Unreleased, in required order.
 * Exact match is required by the validator.
 */
export const ALLOWED_SECTIONS = [
	'Stable Release',
	'Breaking Changes',
	'New Features',
	'Enhancements',
	'Deprecations',
	'Bug Fixes',
	'Internal',
	'Documentation',
];

const GUTENBERG_PR_LINK =
	/\[#\d+\]\(https:\/\/github\.com\/WordPress\/gutenberg\/pull\/\d+\)/;

/**
 * Pattern matching published release headings (e.g. `## 1.2.3 (2026-01-01)`).
 */
const VERSION_HEADING = /^## \d+\.\d+/;

export type ValidateOptions = {
	/**
	 * Path shown in error messages.
	 */
	filePath?: string;

	/**
	 * When set, a link to this pull request in the file must sit under Unreleased.
	 */
	pr?: string;

	/**
	 * When set, Unreleased must cite this pull request.
	 */
	requirePr?: string;
};

export type ParseArgsResult = {
	pr: string | undefined;
	requirePr: string | undefined;
	paths: string[];
};

type UnreleasedSection = {
	/**
	 * Absolute start line of `## Unreleased` in the file (0-based).
	 */
	start: number;

	/**
	 * Lines from `## Unreleased` through the line before the next version heading.
	 */
	lines: string[];
};

/**
 * Locates the Unreleased block: from `## Unreleased` to the next published
 * version heading (`## 1.2.3`), or end of file. Other `##` headings inside
 * that range are left in place so later checks can reject them.
 *
 * @param lines Full changelog split into lines.
 * @return The Unreleased slice, or `undefined` when the heading is missing.
 */
function findUnreleasedSection(
	lines: string[]
): UnreleasedSection | undefined {
	let start = -1;
	for ( let i = 0; i < lines.length; i++ ) {
		if ( /^## Unreleased\s*$/.test( lines[ i ] ) ) {
			start = i;
			break;
		}
	}
	if ( start === -1 ) {
		return undefined;
	}

	let end = lines.length;
	for ( let i = start + 1; i < lines.length; i++ ) {
		if ( VERSION_HEADING.test( lines[ i ] ) ) {
			end = i;
			break;
		}
	}

	return { start, lines: lines.slice( start, end ) };
}

/**
 * Requires Unreleased subsections to be `###` headings. `##` truncates
 * release-tool parsing; `####` and other levels are not used.
 *
 * @param unreleased Unreleased section.
 * @param filePath   Path for error messages.
 * @return Error messages.
 */
function validateSubsectionHeadings(
	unreleased: UnreleasedSection,
	filePath: string
): string[] {
	const errors: string[] = [];
	for ( let i = 1; i < unreleased.lines.length; i++ ) {
		const line = unreleased.lines[ i ];
		if ( /^#{1,6} /.test( line ) && ! /^### /.test( line ) ) {
			errors.push(
				`${ filePath }:${
					unreleased.start + i + 1
				}: unexpected heading inside Unreleased (${ line.trim() }). Subsections must be \`###\`.`
			);
		}
	}
	return errors;
}

/**
 * Requires Unreleased `###` titles to be from the known list, appear once, and
 * follow `ALLOWED_SECTIONS` order.
 *
 * @param unreleased Unreleased section.
 * @param filePath   Path for error messages.
 * @return Error messages.
 */
function validateSectionTitles(
	unreleased: UnreleasedSection,
	filePath: string
): string[] {
	const errors: string[] = [];
	const seenSections = new Set< string >();
	let previousIndex = -1;

	for ( let i = 1; i < unreleased.lines.length; i++ ) {
		const heading = unreleased.lines[ i ].match( /^### (.+)$/ );
		if ( ! heading ) {
			continue;
		}

		const title = heading[ 1 ].trim();
		const lineNo = unreleased.start + i + 1;
		const index = ALLOWED_SECTIONS.indexOf( title );

		if ( index === -1 ) {
			errors.push(
				`${ filePath }:${ lineNo }: unknown Unreleased section "${ title }". Allowed: ${ ALLOWED_SECTIONS.join(
					', '
				) }.`
			);
		}
		if ( seenSections.has( title ) ) {
			errors.push(
				`${ filePath }:${ lineNo }: duplicate Unreleased section "${ title }".`
			);
		}
		seenSections.add( title );

		if ( index !== -1 ) {
			if ( index < previousIndex ) {
				errors.push(
					`${ filePath }:${ lineNo }: Unreleased section "${ title }" is out of order. Expected order: ${ ALLOWED_SECTIONS.join(
						', '
					) }.`
				);
			}
			previousIndex = index;
		}
	}

	return errors;
}

/**
 * Requires each top-level Unreleased list entry to include a Gutenberg pull
 * request link. Nested bullets may rely on a link in the parent block.
 *
 * @param unreleased Unreleased section.
 * @param filePath   Path for error messages.
 * @return Error messages.
 */
function validateEntryLinks(
	unreleased: UnreleasedSection,
	filePath: string
): string[] {
	const errors: string[] = [];

	for ( let i = 1; i < unreleased.lines.length; ) {
		const line = unreleased.lines[ i ];
		// Top-level list items are "- " (not "--" prose leftovers).
		if ( ! /^-\s+/.test( line ) ) {
			i++;
			continue;
		}

		const entryStart = unreleased.start + i + 1;
		const blockLines = [ line ];
		i++;
		while ( i < unreleased.lines.length ) {
			const next = unreleased.lines[ i ];
			if ( /^#{1,6} /.test( next ) || /^-\s+/.test( next ) ) {
				break;
			}
			// Blank lines may sit between a parent bullet and nested children;
			// skip them without ending the entry.
			if ( next === '' ) {
				i++;
				continue;
			}
			if ( /^\s/.test( next ) ) {
				blockLines.push( next );
				i++;
				continue;
			}
			break;
		}

		if ( ! GUTENBERG_PR_LINK.test( blockLines.join( '\n' ) ) ) {
			errors.push(
				`${ filePath }:${ entryStart }: Unreleased entry is missing a Gutenberg pull request link.`
			);
		}
	}

	return errors;
}

/**
 * Markdown link for a Gutenberg pull request.
 *
 * @param pr Pull request number.
 */
function pullRequestLink( pr: string ): string {
	return `[#${ pr }](https://github.com/WordPress/gutenberg/pull/${ pr })`;
}

/**
 * If this PR's pull link appears in the file, it must be under Unreleased.
 * Catches notes that landed in a published version after a package release.
 *
 * @param content    Full changelog markdown.
 * @param unreleased Unreleased section, if present.
 * @param filePath   Path for error messages.
 * @param pr         Pull request number.
 * @return Error messages.
 */
function validatePrLinkPlacement(
	content: string,
	unreleased: UnreleasedSection | undefined,
	filePath: string,
	pr: string
): string[] {
	const requiredLink = pullRequestLink( pr );
	if ( ! content.includes( requiredLink ) ) {
		return [];
	}
	if ( unreleased?.lines.join( '\n' ).includes( requiredLink ) ) {
		return [];
	}
	return [
		`${ filePath }: changelog entry for this PR must be under \`## Unreleased\`, not a published version: ${ requiredLink }`,
	];
}

/**
 * When `--require-pr` is set, requires Unreleased to cite that pull request.
 *
 * @param unreleased Unreleased section.
 * @param filePath   Path for error messages.
 * @param requirePr  Pull request number that must appear.
 * @return Error messages.
 */
function validateRequiredPrLink(
	unreleased: UnreleasedSection,
	filePath: string,
	requirePr: string
): string[] {
	const requiredLink = pullRequestLink( requirePr );
	if ( unreleased.lines.join( '\n' ).includes( requiredLink ) ) {
		return [];
	}
	return [
		`${ filePath }: Unreleased section must include a link to this PR: ${ requiredLink }`,
	];
}

/**
 * Validates a package CHANGELOG's Unreleased section.
 *
 * @param content Changelog markdown.
 * @param options Validation options.
 * @return Error messages (empty when valid).
 */
export function validateChangelog(
	content: string,
	options: ValidateOptions = {}
): string[] {
	const filePath = options.filePath ?? 'CHANGELOG.md';
	const unreleased = findUnreleasedSection( content.split( /\r?\n/ ) );
	const pr = options.pr ?? options.requirePr;
	const placementErrors = pr
		? validatePrLinkPlacement( content, unreleased, filePath, pr )
		: [];

	if ( ! unreleased ) {
		if ( options.requirePr ) {
			return [
				`${ filePath }: missing \`## Unreleased\` section (required when checking for PR #${ options.requirePr }).`,
				...placementErrors,
			];
		}
		return placementErrors;
	}

	return [
		...validateSubsectionHeadings( unreleased, filePath ),
		...validateSectionTitles( unreleased, filePath ),
		...validateEntryLinks( unreleased, filePath ),
		...placementErrors,
		...( options.requirePr
			? validateRequiredPrLink( unreleased, filePath, options.requirePr )
			: [] ),
	];
}

/**
 * @param argv CLI arguments (without node / script path).
 */
export function parseArgs( argv: string[] ): ParseArgsResult {
	const { values, positionals } = parseNodeArgs( {
		args: argv,
		allowPositionals: true,
		strict: true,
		options: {
			pr: { type: 'string' },
			'require-pr': { type: 'string' },
		},
	} );

	return {
		pr: values.pr,
		requirePr: values[ 'require-pr' ],
		paths: positionals,
	};
}

/**
 * @param argv CLI arguments (without node / script path).
 * @return Exit code.
 */
export function run( argv: string[] ): number {
	let pr: string | undefined;
	let requirePr: string | undefined;
	let paths: string[];
	try {
		( { pr, requirePr, paths } = parseArgs( argv ) );
	} catch ( error ) {
		const message =
			error instanceof Error ? error.message : String( error );
		console.error( message );
		return 1;
	}

	const files =
		paths.length > 0
			? paths.map( ( filePath ) => resolveChangelogPath( filePath ) )
			: readdirSync( join( REPO_ROOT, 'packages' ), {
					withFileTypes: true,
				} )
					.filter( ( entry ) => entry.isDirectory() )
					.map( ( entry ) =>
						join(
							REPO_ROOT,
							'packages',
							entry.name,
							'CHANGELOG.md'
						)
					)
					.filter( ( filePath ) => existsSync( filePath ) )
					.sort();

	if ( files.length === 0 ) {
		console.error( 'No CHANGELOG.md files to validate.' );
		return 1;
	}

	let hasErrors = false;
	for ( const filePath of files ) {
		if ( ! existsSync( filePath ) ) {
			console.error( `${ filePath }: file not found.` );
			hasErrors = true;
			continue;
		}
		const content = readFileSync( filePath, 'utf8' );
		const relativePath = relative( REPO_ROOT, filePath );
		const errors = validateChangelog( content, {
			filePath: relativePath,
			pr,
			requirePr,
		} );
		for ( const error of errors ) {
			console.error( error );
			hasErrors = true;
		}
	}

	return hasErrors ? 1 : 0;
}

if (
	process.argv[ 1 ] &&
	import.meta.url === pathToFileURL( resolve( process.argv[ 1 ] ) ).href
) {
	process.exitCode = run( process.argv.slice( 2 ) );
}
