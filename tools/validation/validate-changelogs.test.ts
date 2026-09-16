import { expect, test } from 'vitest';
import { parseArgs, validateChangelog } from './validate-changelogs.ts';

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

test( 'parseArgs reads --require-pr and paths', () => {
	expect(
		parseArgs( [ '--require-pr=82842', 'packages/data/CHANGELOG.md' ] )
	).toEqual( {
		requirePr: '82842',
		paths: [ 'packages/data/CHANGELOG.md' ],
	} );
	expect(
		parseArgs( [ '--require-pr', '82842', 'packages/data/CHANGELOG.md' ] )
	).toEqual( {
		requirePr: '82842',
		paths: [ 'packages/data/CHANGELOG.md' ],
	} );
} );
