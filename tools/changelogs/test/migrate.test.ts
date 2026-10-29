import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	parseChangelogContent,
	migratePackageToChangie,
	rollbackPackageFromChangie,
} from '../lib/migrate.ts';
import { execChangie } from '../lib/release.ts';
import { loadChangieConfig } from '../lib/config.ts';
import { previewUnreleasedFragments } from '../lib/preview.ts';

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
	it.each( [ false, true ] )(
		'rolls back mixed kinds using native preview and preserves inputs on validation failure: %s',
		( invalid ) => {
			const root = fs.mkdtempSync(
				path.join( os.tmpdir(), 'rollback-native-' )
			);
			try {
				const pkgDir = path.join( root, 'packages', 'ui' );
				const unreleased = path.join( root, '.changes', 'unreleased' );
				const versions = path.join( root, '.changes', 'ui' );
				fs.mkdirSync( pkgDir, { recursive: true } );
				fs.mkdirSync( unreleased, { recursive: true } );
				fs.mkdirSync( versions );
				const config = loadChangieConfig(
					path.resolve( import.meta.dirname, '../../..' )
				);
				fs.writeFileSync(
					path.join( root, '.changie.yaml' ),
					JSON.stringify( {
						...config,
						projects: config.projects.filter(
							( project ) => project.key === 'ui'
						),
					} )
				);
				fs.writeFileSync(
					path.join( pkgDir, 'package.json' ),
					'{"version":"0.25.0"}'
				);
				const changelogPath = path.join( pkgDir, 'CHANGELOG.md' );
				const history =
					'## 0.25.0 (2026-10-01)\n\n### Bug Fixes\n\n-   Published fix.\n';
				fs.writeFileSync( changelogPath, history );
				fs.writeFileSync( path.join( versions, '0.25.0.md' ), history );
				const fragmentPaths = [];
				for ( const [ index, kind ] of [
					'Bug Fixes',
					'Stable Release',
					'Enhancements',
				].entries() ) {
					const file = path.join( unreleased, `${ index }.yaml` );
					fs.writeFileSync(
						file,
						JSON.stringify( {
							project: 'ui',
							kind,
							body: `Change for ${ kind }`,
							time: invalid ? 'garbage' : '2026-10-29T00:00:00Z',
							custom: { PR: '85369' },
						} )
					);
					fragmentPaths.push( file );
				}
				const files = [
					changelogPath,
					path.join( versions, '0.25.0.md' ),
					...fragmentPaths,
				];
				const before = files.map( ( file ) =>
					fs.readFileSync( file, 'utf8' )
				);
				const preview = invalid
					? ''
					: previewUnreleasedFragments( 'ui', root );
				let failure;
				let result;
				try {
					rollbackPackageFromChangie( 'ui', root, true );
					result = rollbackPackageFromChangie( 'ui', root );
				} catch ( error ) {
					failure = error;
				}
				const expectedFailure =
					expect.stringContaining( 'Failed to preview' );
				expect(
					failure instanceof Error ? failure.message : undefined
				).toEqual( invalid ? expectedFailure : undefined );
				const restored = fs.readFileSync( changelogPath, 'utf8' );
				expect( restored ).toContain(
					invalid ? history : preview + '\n' + history
				);
				expect( result?.fragmentsRestored ).toBe(
					invalid ? undefined : 3
				);
				expect( fs.existsSync( versions ) ).toBe( invalid );
				expect( fs.readdirSync( unreleased ) ).toEqual(
					invalid ? [ '0.yaml', '1.yaml', '2.yaml' ] : []
				);
				for ( const [ index, file ] of ( invalid
					? files
					: []
				).entries() ) {
					expect( fs.readFileSync( file, 'utf8' ) ).toBe(
						before[ index ]
					);
				}
				expect(
					preview.includes(
						'Note: This package is now a stable release.'
					)
				).toBe( ! invalid );
				expect(
					preview.indexOf( '### Enhancements' ) <=
						preview.indexOf( '### Bug Fixes' )
				).toBe( true );
				expect(
					preview.indexOf( '### Bug Fixes' ) <=
						preview.indexOf( '### Stable Release' )
				).toBe( true );
			} finally {
				fs.rmSync( root, { recursive: true, force: true } );
			}
		}
	);

	it( 'uses the same UUID filename format for migrated and authored fragments', () => {
		const tmpDir = fs.mkdtempSync(
			path.join( os.tmpdir(), 'changie-migration-names-' )
		);
		try {
			const pkgDir = path.join( tmpDir, 'packages', 'test-pkg' );
			fs.mkdirSync( pkgDir, { recursive: true } );
			fs.writeFileSync(
				path.join( pkgDir, 'CHANGELOG.md' ),
				SAMPLE_CHANGELOG
			);
			const result = migratePackageToChangie( 'test-pkg', tmpDir );
			const files = fs.readdirSync(
				path.join( tmpDir, '.changes', 'unreleased' )
			);
			expect( files ).toHaveLength( 3 );
			for ( const file of files ) {
				expect( file ).toMatch(
					/^1234[567]__test-pkg__(bug-fixes|enhancements)__[a-f0-9]{12}\.yaml$/
				);
			}
			expect( result.fragmentsCreated ).toBe( 3 );
		} finally {
			fs.rmSync( tmpDir, { recursive: true, force: true } );
		}
	} );

	it.each( [ false, true ] )(
		'preserves migration artifacts when update finds no unreleased entries (dry-run: %s)',
		( dryRun ) => {
			const tmpDir = fs.mkdtempSync(
				path.join( os.tmpdir(), 'changie-update-guard-' )
			);
			try {
				const pkgDir = path.join( tmpDir, 'packages', 'test-pkg' );
				fs.mkdirSync( pkgDir, { recursive: true } );
				const changelogPath = path.join( pkgDir, 'CHANGELOG.md' );
				fs.writeFileSync( changelogPath, SAMPLE_CHANGELOG );
				const initial = migratePackageToChangie( 'test-pkg', tmpDir );
				const files = initial.operations.map( ( operation ) => ( {
					path: operation.path,
					content: fs.readFileSync( operation.path, 'utf8' ),
				} ) );

				const result = migratePackageToChangie(
					'test-pkg',
					tmpDir,
					dryRun,
					true
				);

				expect( result ).toEqual( {
					packageName: 'test-pkg',
					versionsCreated: 0,
					fragmentsCreated: 0,
					operations: [],
				} );
				for ( const file of files ) {
					expect( fs.readFileSync( file.path, 'utf8' ) ).toBe(
						file.content
					);
				}
			} finally {
				fs.rmSync( tmpDir, { recursive: true, force: true } );
			}
		}
	);

	it( 'migrates published history without unreleased entries on an initial run', () => {
		const tmpDir = fs.mkdtempSync(
			path.join( os.tmpdir(), 'changie-history-only-' )
		);
		try {
			const pkgDir = path.join( tmpDir, 'packages', 'test-pkg' );
			fs.mkdirSync( pkgDir, { recursive: true } );
			const history = SAMPLE_CHANGELOG.slice(
				SAMPLE_CHANGELOG.indexOf( '## 2.1.0' )
			);
			fs.writeFileSync( path.join( pkgDir, 'CHANGELOG.md' ), history );

			const result = migratePackageToChangie( 'test-pkg', tmpDir );

			expect( result.versionsCreated ).toBe( 1 );
			expect( result.fragmentsCreated ).toBe( 0 );
			expect(
				fs.readFileSync(
					path.join( tmpDir, '.changes', 'test-pkg', '2.1.0.md' ),
					'utf8'
				)
			).toBe( history );
		} finally {
			fs.rmSync( tmpDir, { recursive: true, force: true } );
		}
	} );

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
		expect( firstResult.versionsCreated ).toBe( 1 );

		const unreleasedDir = path.join( tmpDir, '.changes', 'unreleased' );
		const initialFragments = fs
			.readdirSync( unreleasedDir )
			.filter( ( f ) => f.endsWith( '.yaml' ) );
		expect( initialFragments.length ).toBe( 3 );

		// Check project version directory has 1 baseline file named after latest release (2.1.0.md)
		// containing both 2.1.0 and 2.0.0 sections
		const initialVersionFiles = fs
			.readdirSync( path.join( tmpDir, '.changes', 'test-pkg' ) )
			.filter( ( f ) => f.endsWith( '.md' ) );
		expect( initialVersionFiles ).toEqual( [ '2.1.0.md' ] );
		const baselineContent = fs.readFileSync(
			path.join( tmpDir, '.changes', 'test-pkg', '2.1.0.md' ),
			'utf8'
		);
		expect( baselineContent ).toContain( '## 2.1.0 (2026-10-01)' );
		expect( baselineContent ).toContain( '## 2.0.0 (2026-09-01)' );

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
		expect( updateResult.versionsCreated ).toBe( 1 );

		// Check that the old fragments were removed and only 1 fragment remains
		const updatedFragments = fs
			.readdirSync( unreleasedDir )
			.filter( ( f ) => f.endsWith( '.yaml' ) );
		expect( updatedFragments.length ).toBe( 1 );

		// Check project version directory has 1 updated baseline file named after 2.2.0.md
		const versionFiles = fs
			.readdirSync( path.join( tmpDir, '.changes', 'test-pkg' ) )
			.filter( ( f ) => f.endsWith( '.md' ) );
		expect( versionFiles ).toEqual( [ '2.2.0.md' ] );
		const updatedBaselineContent = fs.readFileSync(
			path.join( tmpDir, '.changes', 'test-pkg', '2.2.0.md' ),
			'utf8'
		);
		expect( updatedBaselineContent ).toContain( '## 2.2.0 (2026-10-15)' );
		expect( updatedBaselineContent ).toContain( '## 2.1.0 (2026-10-01)' );
		expect( updatedBaselineContent ).toContain( '## 2.0.0 (2026-09-01)' );

		// Check CHANGELOG.md was updated to exclude the Unreleased section
		const finalChangelog = fs.readFileSync(
			path.join( pkgDir, 'CHANGELOG.md' ),
			'utf8'
		);
		expect( finalChangelog ).not.toContain( '## Unreleased' );
		expect( finalChangelog ).not.toContain( 'Fixed brand new bug C' );
		expect( finalChangelog ).toContain( '## 2.2.0 (2026-10-15)' );
		expect( finalChangelog ).toContain( '## 2.1.0 (2026-10-01)' );

		// Cleanup
		fs.rmSync( tmpDir, { recursive: true, force: true } );
	} );

	it( 'supports rollback when package uses a baseline version file', () => {
		const tmpDir = fs.mkdtempSync(
			path.join( os.tmpdir(), 'changie-rollback-' )
		);
		const pkgDir = path.join( tmpDir, 'packages', 'test-pkg' );
		fs.mkdirSync( pkgDir, { recursive: true } );
		fs.writeFileSync(
			path.join( tmpDir, '.changie.yaml' ),
			JSON.stringify( {
				...loadChangieConfig(
					path.resolve( import.meta.dirname, '../../..' )
				),
				projects: [
					{
						key: 'test-pkg',
						label: 'Test',
						changelog: 'packages/test-pkg/CHANGELOG.md',
					},
				],
			} )
		);

		fs.writeFileSync(
			path.join( pkgDir, 'CHANGELOG.md' ),
			SAMPLE_CHANGELOG
		);

		// Migrate
		migratePackageToChangie( 'test-pkg', tmpDir, false, false );
		const expectedPreview = previewUnreleasedFragments(
			'test-pkg',
			tmpDir
		);
		const baselinePath = path.join(
			tmpDir,
			'.changes',
			'test-pkg',
			'2.1.0.md'
		);
		const baseline = fs.readFileSync( baselinePath, 'utf8' );

		// Rollback
		const rollbackRes = rollbackPackageFromChangie(
			'test-pkg',
			tmpDir,
			false
		);
		expect( rollbackRes.versionsRestored ).toBe( 1 );
		expect( rollbackRes.fragmentsRestored ).toBe( 3 );

		const restoredChangelog = fs.readFileSync(
			path.join( pkgDir, 'CHANGELOG.md' ),
			'utf8'
		);
		expect( restoredChangelog ).toContain( '## Unreleased' );
		expect( restoredChangelog ).toContain( expectedPreview );
		expect( restoredChangelog ).toContain( baseline );
		expect( restoredChangelog.indexOf( '### Enhancements' ) ).toBeLessThan(
			restoredChangelog.indexOf( '### Bug Fixes' )
		);
		expect( restoredChangelog ).toContain( 'Fixed bug A' );
		expect( restoredChangelog ).toContain( '## 2.1.0 (2026-10-01)' );
		expect( restoredChangelog ).toContain( '## 2.0.0 (2026-09-01)' );

		fs.rmSync( tmpDir, { recursive: true, force: true } );
	} );

	it( 'works with changie merge when a new version is batched on top of the baseline', () => {
		const tmpDir = fs.mkdtempSync(
			path.join( os.tmpdir(), 'changie-merge-' )
		);
		const pkgDir = path.join( tmpDir, 'packages', 'test-pkg' );
		fs.mkdirSync( pkgDir, { recursive: true } );
		fs.writeFileSync(
			path.join( tmpDir, '.changie.yaml' ),
			[
				'changesDir: .changes',
				'unreleasedDir: unreleased',
				'headerPath: header.tpl.md',
				'versionExt: md',
				'versionFormat: "## {{.Version}} ({{.Time.Format \\"2006-01-02\\"}})"',
				'kindFormat: "### {{.Kind}}"',
				'changeFormat: "-   {{.Body}} ([#{{.Custom.PR}}](https://github.com/WordPress/gutenberg/pull/{{.Custom.PR}}))."',
				'projects:',
				'  - key: test-pkg',
				'    changelog: packages/test-pkg/CHANGELOG.md',
			].join( '\n' ) + '\n'
		);
		fs.mkdirSync( path.join( tmpDir, '.changes' ), { recursive: true } );
		fs.writeFileSync(
			path.join( tmpDir, '.changes', 'header.tpl.md' ),
			'<!-- Header -->\n'
		);

		fs.writeFileSync(
			path.join( pkgDir, 'CHANGELOG.md' ),
			SAMPLE_CHANGELOG
		);

		// Migrate to baseline (creates .changes/test-pkg/2.1.0.md containing 2.1.0 and 2.0.0)
		migratePackageToChangie( 'test-pkg', tmpDir, false, false );

		// Simulate a new release version file 2.2.0.md created by batching
		fs.writeFileSync(
			path.join( tmpDir, '.changes', 'test-pkg', '2.2.0.md' ),
			'## 2.2.0 (2026-10-20)\n\n### New Features\n\n-   Brand new feature ([#99999](https://github.com/WordPress/gutenberg/pull/99999)).\n'
		);

		// Run changie merge via node runner using the bundled binary
		const mergeRes = execChangie( [ 'merge' ], tmpDir );
		expect( mergeRes.status ).toBe( 0 );

		const mergedChangelog = fs.readFileSync(
			path.join( pkgDir, 'CHANGELOG.md' ),
			'utf8'
		);

		// Changelog should have 2.2.0, followed by 2.1.0, followed by 2.0.0
		expect( mergedChangelog ).toContain( '## 2.2.0 (2026-10-20)' );
		expect( mergedChangelog ).toContain( '## 2.1.0 (2026-10-01)' );
		expect( mergedChangelog ).toContain( '## 2.0.0 (2026-09-01)' );
		expect(
			mergedChangelog.indexOf( '## 2.2.0 (2026-10-20)' )
		).toBeLessThan( mergedChangelog.indexOf( '## 2.1.0 (2026-10-01)' ) );
		expect(
			mergedChangelog.indexOf( '## 2.1.0 (2026-10-01)' )
		).toBeLessThan( mergedChangelog.indexOf( '## 2.0.0 (2026-09-01)' ) );

		fs.rmSync( tmpDir, { recursive: true, force: true } );
	} );
} );
