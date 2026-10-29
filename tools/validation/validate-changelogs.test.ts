import { dirname, join, resolve } from 'node:path';
import {
	mkdtempSync,
	mkdirSync,
	readFileSync,
	readdirSync,
	rmSync,
	writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { describe, expect, test, vi } from 'vitest';
import {
	parseArgs,
	resolveChangelogPath,
	validateChangelog,
	run,
} from './validate-changelogs.ts';

describe( 'native fragment compilation in changelog lint', () => {
	test.each( [
		'time: garbage',
		'time: 123',
		'time: [2026, 10]',
		'time: "2026-10-29T10:30:00Z"\ncustom:\n  PR: "85369"\n  Metadata: [one, two]',
		'time: "2026-10-29T10:30:00Z"\ncustom:\n  PR: "85369"\n  Metadata: {nested: value}',
		'time: "2026-10-29T10:30:00Z"',
	] )( 'checks native compatibility and preserves files: %s', ( fields ) => {
		const root = mkdtempSync(
			join( tmpdir(), 'changelog-native-validation-' )
		);
		try {
			const pkgDir = join( root, 'packages', 'ui' );
			const unreleased = join( root, '.changes', 'unreleased' );
			const released = join( root, '.changes', 'ui' );
			mkdirSync( pkgDir, { recursive: true } );
			mkdirSync( unreleased, { recursive: true } );
			mkdirSync( released );
			writeFileSync(
				join( root, '.changie.yaml' ),
				[
					'changesDir: .changes',
					'unreleasedDir: unreleased',
					'versionExt: md',
					'versionFormat: "## {{.Version}}"',
					'kindFormat: "### {{.Kind}}"',
					'changeFormat: "- {{.Body}}"',
					'kinds:',
					'  - label: Bug Fixes',
					'projects:',
					'  - key: ui',
					'    label: UI',
					'    changelog: packages/ui/CHANGELOG.md',
				].join( '\n' )
			);
			const changelogPath = join( pkgDir, 'CHANGELOG.md' );
			const fragmentPath = join( unreleased, 'example.yaml' );
			const baselinePath = join( released, '0.25.0.md' );
			writeFileSync( changelogPath, '## 0.25.0\n' );
			writeFileSync( baselinePath, '## 0.25.0\n' );
			writeFileSync(
				fragmentPath,
				`project: ui\nkind: Bug Fixes\nbody: Fix alignment\n${ fields }\n` +
					( fields.includes( 'custom:' )
						? ''
						: 'custom:\n  PR: "85369"\n' )
			);
			const files = [ changelogPath, fragmentPath, baselinePath ];
			const before = files.map( ( file ) =>
				readFileSync( file, 'utf8' )
			);
			const valid = fields === 'time: "2026-10-29T10:30:00Z"';
			const errors = vi
				.spyOn( console, 'error' )
				.mockImplementation( () => {} );
			expect( run( [ changelogPath ], root ) ).toBe( valid ? 0 : 1 );
			expect(
				files.map( ( file ) => readFileSync( file, 'utf8' ) )
			).toEqual( before );
			expect( readdirSync( unreleased ) ).toEqual( [ 'example.yaml' ] );
			expect( readdirSync( released ) ).toEqual( [ '0.25.0.md' ] );
			const failure = expect.stringContaining(
				'Changie fragment compilation failed for ui:'
			);
			expect( errors.mock.calls ).toEqual( valid ? [] : [ [ failure ] ] );
			for ( const call of errors.mock.calls ) {
				expect( console ).toHaveErroredWith( ...call );
			}
		} finally {
			vi.restoreAllMocks();
			rmSync( root, { recursive: true, force: true } );
		}
	} );
} );

const REPO_ROOT = resolve(
	dirname( fileURLToPath( import.meta.url ) ),
	'../..'
);

const HEADER =
	'<!-- Learn how to maintain this file at https://github.com/WordPress/gutenberg/tree/HEAD/packages#maintaining-changelogs. -->\n\n';

function changelog( unreleasedBody: string ): string {
	return (
		HEADER +
		'## Unreleased\n\n' +
		unreleasedBody +
		'\n## 1.0.0 (2026-01-01)\n'
	);
}

describe( 'validateChangelog', () => {
	test( 'accepts a well-formed Unreleased section', () => {
		const errors = validateChangelog(
			changelog( `### Enhancements

-   Improved something ([#12345](https://github.com/WordPress/gutenberg/pull/12345)).

### Bug Fixes

-   Fixed something ([#12346](https://github.com/WordPress/gutenberg/pull/12346)).
` ),
			{ filePath: 'packages/example/CHANGELOG.md' }
		);
		expect( errors ).toEqual( [] );
	} );

	test( 'accepts nested list items when a child carries the PR link', () => {
		const errors = validateChangelog(
			changelog( `### Breaking Changes

-   Parent description:
    -   \`Child\` ([#82570](https://github.com/WordPress/gutenberg/pull/82570))
` )
		);
		expect( errors ).toEqual( [] );
	} );

	test( 'finds a nested PR link after a blank line under the parent bullet', () => {
		const errors = validateChangelog(
			changelog( `### Breaking Changes

-   Parent description:

    -   \`Child\` ([#82570](https://github.com/WordPress/gutenberg/pull/82570))
` ),
			{ filePath: 'packages/ui/CHANGELOG.md' }
		);
		expect( errors ).toEqual( [
			'packages/ui/CHANGELOG.md:9: blank line inside an Unreleased list. Entries and their nested lines must not be separated by blank lines.',
		] );
	} );

	test( 'accepts a PR link on a soft-wrapped continuation line', () => {
		const errors = validateChangelog(
			changelog( `### Bug Fixes

-   Fixed something that wraps onto the next line
    ([#82570](https://github.com/WordPress/gutenberg/pull/82570)).
` )
		);
		expect( errors ).toEqual( [] );
	} );

	test( 'rejects headings other than ### inside Unreleased', () => {
		const errors = validateChangelog(
			changelog( `## Enhancements

-   Optimized listeners ([#82842](https://github.com/WordPress/gutenberg/pull/82842)).

#### Notes

-   Extra detail ([#82842](https://github.com/WordPress/gutenberg/pull/82842)).
` ),
			{ filePath: 'packages/data/CHANGELOG.md' }
		);
		expect( errors ).toEqual( [
			'packages/data/CHANGELOG.md:5: unexpected heading inside Unreleased (## Enhancements). Subsections must be `###`.',
			'packages/data/CHANGELOG.md:9: unexpected heading inside Unreleased (#### Notes). Subsections must be `###`.',
		] );
	} );

	test( 'rejects unknown section titles', () => {
		const errors = validateChangelog(
			changelog( `### Docs

-   Clarified README ([#82956](https://github.com/WordPress/gutenberg/pull/82956)).
` ),
			{ filePath: 'packages/dataviews/CHANGELOG.md' }
		);
		expect( errors[ 0 ] ).toMatch( /unknown Unreleased section "Docs"/ );
	} );

	test( 'rejects duplicate section titles', () => {
		const errors = validateChangelog(
			changelog( `### Bug Fixes

-   First ([#1](https://github.com/WordPress/gutenberg/pull/1)).

### Bug Fixes

-   Second ([#2](https://github.com/WordPress/gutenberg/pull/2)).
` ),
			{ filePath: 'packages/ui/CHANGELOG.md' }
		);
		expect( errors ).toEqual( [
			'packages/ui/CHANGELOG.md:9: duplicate Unreleased section "Bug Fixes".',
		] );
	} );

	test( 'rejects Unreleased sections that are out of order', () => {
		const errors = validateChangelog(
			changelog( `### Bug Fixes

-   Fixed something ([#1](https://github.com/WordPress/gutenberg/pull/1)).

### Enhancements

-   Improved something ([#2](https://github.com/WordPress/gutenberg/pull/2)).
` ),
			{ filePath: 'packages/ui/CHANGELOG.md' }
		);
		expect( errors ).toEqual( [
			'packages/ui/CHANGELOG.md:9: Unreleased section "Enhancements" is out of order. Expected order: Stable Release, Breaking Changes, New Features, Enhancements, Deprecations, Bug Fixes, Internal, Documentation.',
		] );
	} );

	test( 'rejects top-level entries without a Gutenberg pull request link', () => {
		const errors = validateChangelog(
			changelog( `### Bug Fixes

-   Fixed something without a link.
` ),
			{ filePath: 'packages/rich-text/CHANGELOG.md' }
		);
		expect( errors ).toEqual( [
			'packages/rich-text/CHANGELOG.md:7: Unreleased entry is missing a Gutenberg pull request link.',
		] );
	} );

	test( 'rejects issue links in place of pull request links', () => {
		const errors = validateChangelog(
			changelog( `### Bug Fixes

-   Fixed something ([#12346](https://github.com/WordPress/gutenberg/issues/12346)).
` ),
			{ filePath: 'packages/sync/CHANGELOG.md' }
		);
		expect( errors ).toEqual( [
			'packages/sync/CHANGELOG.md:7: Unreleased entry is missing a Gutenberg pull request link.',
		] );
	} );

	test( 'rejects blank lines between top-level entries', () => {
		const errors = validateChangelog(
			changelog( `### Bug Fixes

-   Fixed one thing ([#1](https://github.com/WordPress/gutenberg/pull/1)).

-   Fixed another thing ([#2](https://github.com/WordPress/gutenberg/pull/2)).
` ),
			{ filePath: 'packages/ui/CHANGELOG.md' }
		);
		expect( errors ).toEqual( [
			'packages/ui/CHANGELOG.md:9: blank line inside an Unreleased list. Entries and their nested lines must not be separated by blank lines.',
		] );
	} );

	test( 'requirePr checks for this pull request link under Unreleased', () => {
		const content = changelog( `### Internal

-   Touched the package ([#99](https://github.com/WordPress/gutenberg/pull/99)).
` );
		expect(
			validateChangelog( content, {
				filePath: 'packages/components/CHANGELOG.md',
				requirePr: '100',
			} )
		).toEqual( [
			'packages/components/CHANGELOG.md: Unreleased section must include a link to this PR: [#100](https://github.com/WordPress/gutenberg/pull/100)',
		] );
		expect(
			validateChangelog( content, {
				filePath: 'packages/components/CHANGELOG.md',
				requirePr: '99',
			} )
		).toEqual( [] );
	} );

	test( 'requirePr fails when Unreleased is missing', () => {
		const errors = validateChangelog( '## 1.0.0 (2026-01-01)\n', {
			filePath: 'packages/example/CHANGELOG.md',
			requirePr: '42',
		} );
		expect( errors[ 0 ] ).toMatch( /missing `## Unreleased`/ );
	} );

	test( 'pr flags a link that sits under a published version', () => {
		const content = `${ HEADER }## Unreleased

## 1.0.0 (2026-01-01)

### Bug Fixes

-   Fixed something ([#99](https://github.com/WordPress/gutenberg/pull/99)).
`;
		expect(
			validateChangelog( content, {
				filePath: 'packages/data/CHANGELOG.md',
				pr: '99',
			} )
		).toEqual( [
			'packages/data/CHANGELOG.md: changelog entry for this PR must be under `## Unreleased`, not a published version: [#99](https://github.com/WordPress/gutenberg/pull/99)',
		] );
		expect(
			validateChangelog( content, {
				filePath: 'packages/data/CHANGELOG.md',
				pr: '100',
			} )
		).toEqual( [] );
	} );
} );

describe( 'resolveChangelogPath', () => {
	test( 'treats inputs as relative to the invocation directory', () => {
		expect(
			resolveChangelogPath( 'packages/ui/CHANGELOG.md', '/repo' )
		).toBe( resolve( '/repo', 'packages/ui/CHANGELOG.md' ) );
		expect(
			resolveChangelogPath( 'packages/ui/CHANGELOG.md', REPO_ROOT )
		).toBe( resolve( REPO_ROOT, 'packages/ui/CHANGELOG.md' ) );
	} );
} );

describe( 'parseArgs', () => {
	test( 'reads --pr, --require-pr, and paths', () => {
		expect(
			parseArgs( [ '--require-pr=82842', 'packages/data/CHANGELOG.md' ] )
		).toEqual( {
			pr: undefined,
			requirePr: '82842',
			paths: [ 'packages/data/CHANGELOG.md' ],
		} );
		expect(
			parseArgs( [ '--pr', '82842', 'packages/data/CHANGELOG.md' ] )
		).toEqual( {
			pr: '82842',
			requirePr: undefined,
			paths: [ 'packages/data/CHANGELOG.md' ],
		} );
	} );
} );
