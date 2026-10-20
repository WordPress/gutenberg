import { describe, expect, it } from 'vitest';
import { parseChangelogContent } from '../lib/migrate.ts';

const SAMPLE_CHANGELOG = `<!-- Preamble comment -->

## Unreleased

### Bug Fixes

-   Fixed bug A ([#12345](https://github.com/WordPress/gutenberg/pull/12345)).
-   Fixed multi-line bug
    with additional details ([#12346](https://github.com/WordPress/gutenberg/pull/12346)).

### Enhancements

-   Enhanced feature B ([#12347](https://github.com/WordPress/gutenberg/pull/12347)).

## 2.1.0 (2026-10-01)

### Enhancements

-   Shipped feature in 2.1.0 ([#11111](https://github.com/WordPress/gutenberg/pull/11111)).

## 2.0.0 (2026-09-01)

### Breaking Changes

-   Breaking change in 2.0.0 ([#10000](https://github.com/WordPress/gutenberg/pull/10000)).
`;

describe( 'parseChangelogContent', () => {
	it( 'parses unreleased entries and version sections correctly', () => {
		const parsed = parseChangelogContent( SAMPLE_CHANGELOG );

		expect( parsed.unreleasedEntries.length ).toBe( 3 );
		expect( parsed.unreleasedEntries[ 0 ].kind ).toBe( 'Bug Fixes' );
		expect( parsed.unreleasedEntries[ 0 ].pr ).toBe( 12345 );
		expect( parsed.unreleasedEntries[ 0 ].body ).toBe( 'Fixed bug A' );

		expect( parsed.unreleasedEntries[ 1 ].pr ).toBe( 12346 );
		expect( parsed.unreleasedEntries[ 1 ].body ).toContain(
			'with additional details'
		);

		expect( parsed.unreleasedEntries[ 2 ].kind ).toBe( 'Enhancements' );
		expect( parsed.unreleasedEntries[ 2 ].pr ).toBe( 12347 );

		expect( parsed.versions.length ).toBe( 2 );
		expect( parsed.versions[ 0 ].version ).toBe( '2.1.0' );
		expect( parsed.versions[ 0 ].filename ).toBe( '2.1.0.md' );
		expect( parsed.versions[ 0 ].content ).toContain(
			'## 2.1.0 (2026-10-01)'
		);

		expect( parsed.versions[ 1 ].version ).toBe( '2.0.0' );
		expect( parsed.versions[ 1 ].filename ).toBe( '2.0.0.md' );
	} );
} );
