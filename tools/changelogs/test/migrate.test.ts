import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	parseChangelogContent,
	migratePackageToChangie,
} from '../lib/migrate.ts';

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

describe( 'migratePackageToChangie with cleanFirst / update', () => {
	it( 'cleans up previous fragments and version files when cleanFirst is true', () => {
		const tmpDir = fs.mkdtempSync(
			path.join( os.tmpdir(), 'changie-test-' )
		);
		const pkgDir = path.join( tmpDir, 'packages', 'test-pkg' );
		fs.mkdirSync( pkgDir, { recursive: true } );
		fs.writeFileSync(
			path.join( tmpDir, '.changie.yaml' ),
			'changes_dir: .changes\nunreleased_dir: unreleased\n'
		);

		// Initial changelog
		fs.writeFileSync(
			path.join( pkgDir, 'CHANGELOG.md' ),
			SAMPLE_CHANGELOG
		);

		// First migration run
		const firstResult = migratePackageToChangie(
			'test-pkg',
			tmpDir,
			false,
			false
		);
		expect( firstResult.fragmentsCreated ).toBe( 3 );
		expect( firstResult.versionsCreated ).toBe( 2 );

		const unreleasedDir = path.join( tmpDir, '.changes', 'unreleased' );
		const initialFragments = fs
			.readdirSync( unreleasedDir )
			.filter( ( f ) => f.endsWith( '.yaml' ) );
		expect( initialFragments.length ).toBe( 3 );

		// Simulate updated changelog from trunk with 1 new unreleased entry and 1 extra version
		const UPDATED_CHANGELOG = `<!-- Preamble comment -->

## Unreleased

### Bug Fixes

-   Fixed brand new bug C ([#12399](https://github.com/WordPress/gutenberg/pull/12399)).

## 2.2.0 (2026-10-15)

### Enhancements

-   Shipped feature in 2.2.0 ([#11222](https://github.com/WordPress/gutenberg/pull/11222)).

## 2.1.0 (2026-10-01)

### Enhancements

-   Shipped feature in 2.1.0 ([#11111](https://github.com/WordPress/gutenberg/pull/11111)).

## 2.0.0 (2026-09-01)

### Breaking Changes

-   Breaking change in 2.0.0 ([#10000](https://github.com/WordPress/gutenberg/pull/10000)).
`;

		// Overwrite CHANGELOG.md with trunk's version
		fs.writeFileSync(
			path.join( pkgDir, 'CHANGELOG.md' ),
			UPDATED_CHANGELOG
		);

		// Re-run migration with cleanFirst = true (update mode)
		const updateResult = migratePackageToChangie(
			'test-pkg',
			tmpDir,
			false,
			true
		);
		expect( updateResult.fragmentsCreated ).toBe( 1 );
		expect( updateResult.versionsCreated ).toBe( 3 );

		// Check that the old fragments were removed and only 1 fragment remains
		const updatedFragments = fs
			.readdirSync( unreleasedDir )
			.filter( ( f ) => f.endsWith( '.yaml' ) );
		expect( updatedFragments.length ).toBe( 1 );

		// Check project version directory has 3 versions
		const versionFiles = fs
			.readdirSync( path.join( tmpDir, '.changes', 'test-pkg' ) )
			.filter( ( f ) => f.endsWith( '.md' ) );
		expect( versionFiles.length ).toBe( 3 );

		// Cleanup
		fs.rmSync( tmpDir, { recursive: true, force: true } );
	} );
} );
