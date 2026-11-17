import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, test } from 'vitest';
import { loadChangieConfig } from '@wordpress/changelog-tools/config';
import {
	findRangeMismatches,
	nextReleaseVersion,
	readWorkspaces,
} from './check-peer-version-ranges.ts';

const changelog = ( body: string ) =>
	`## Unreleased\n\n${ body }\n## 1.0.0 (2026-01-01)\n\n### Breaking Changes\n\n-   Old.\n`;

describe( 'workspace changelog sources', () => {
	test.each( [
		{
			behavior: 'flags the next breaking version from fragments',
			version: '3.1.0',
			range: '^3.0.0',
			kinds: [ 'Breaking Changes' ],
			usesChangie: true,
			nextVersion: '4.0.0',
		},
		{
			behavior: 'flags stable promotion even with breaking fragments',
			version: '0.26.0',
			range: '^0.26.0',
			kinds: [ 'Breaking Changes', 'Stable Release' ],
			usesChangie: true,
			nextVersion: '1.0.0',
		},
		{
			behavior: 'ignores published history when no fragments exist',
			version: '3.1.0',
			range: '^3.0.0',
			kinds: [],
			usesChangie: true,
			nextVersion: null,
		},
		{
			behavior:
				'reads traditional changelogs for packages without fragments',
			version: '3.1.0',
			range: '^3.0.0',
			kinds: [],
			usesChangie: false,
			nextVersion: '4.0.0',
		},
	] )(
		'$behavior',
		( { version, range, kinds, usesChangie, nextVersion } ) => {
			const root = mkdtempSync(
				join( tmpdir(), 'peer-range-changelogs-' )
			);
			try {
				const config = loadChangieConfig(
					resolve( import.meta.dirname, '../..' )
				);
				writeFileSync(
					join( root, '.changie.yaml' ),
					JSON.stringify( {
						...config,
						projects: usesChangie
							? config.projects.filter(
									( project ) => project.key === 'ui'
								)
							: [],
					} )
				);
				const target = join( root, 'packages', 'ui' );
				const consumer = join( root, 'packages', 'consumer' );
				const unreleased = join( root, '.changes', 'unreleased' );
				mkdirSync( target, { recursive: true } );
				mkdirSync( consumer );
				mkdirSync( unreleased, { recursive: true } );
				writeFileSync(
					join( target, 'package.json' ),
					JSON.stringify( { name: '@wordpress/ui', version } )
				);
				writeFileSync(
					join( target, 'CHANGELOG.md' ),
					usesChangie
						? `## ${ version }\n\n### Breaking Changes\n\n- Published change.\n`
						: changelog(
								'### Breaking Changes\n\n- Pending change.\n'
							)
				);
				writeFileSync(
					join( consumer, 'package.json' ),
					JSON.stringify( {
						name: '@wordpress/consumer',
						version: '1.0.0',
						peerDependencies: { '@wordpress/ui': range },
					} )
				);
				for ( const kind of kinds ) {
					writeFileSync(
						join( unreleased, `${ kind }.yaml` ),
						JSON.stringify( {
							project: 'ui',
							kind,
							body: 'Prepare release.',
							time: '2026-11-17T00:00:00Z',
							custom: { PR: '85369' },
						} )
					);
				}
				const workspaces = readWorkspaces( root );
				expect(
					nextReleaseVersion(
						version,
						workspaces[ 'packages/ui' ].changelog!
					)
				).toBe( nextVersion );
				expect( findRangeMismatches( workspaces ) ).toEqual(
					nextVersion
						? [
								{
									workspace: 'packages/consumer',
									peer: '@wordpress/ui',
									range,
									version: nextVersion,
									reason: 'the version its unreleased changelog entries will release as',
								},
							]
						: []
				);
			} finally {
				rmSync( root, { recursive: true, force: true } );
			}
		}
	);
} );

describe( 'nextReleaseVersion', () => {
	test( 'follows the release tool bump rules', () => {
		const breaking = changelog( '### Breaking Changes\n\n-   New.\n' );
		expect( nextReleaseVersion( '3.1.0', breaking ) ).toBe( '4.0.0' );
		expect( nextReleaseVersion( '0.8.2', breaking ) ).toBe( '0.9.0' );
		expect(
			nextReleaseVersion(
				'0.8.2',
				changelog(
					'### Stable Release\n\n-   Go.\n\n### Breaking Changes\n\n-   New.\n'
				)
			)
		).toBe( '1.0.0' );
		expect( nextReleaseVersion( '3.1.0', changelog( '' ) ) ).toBeNull();
	} );
} );

describe( 'findRangeMismatches', () => {
	const workspaces = (
		range: string,
		theme: string,
		themeVersion = '3.0.0'
	) => ( {
		'packages/a': {
			manifest: {
				name: '@wordpress/a',
				version: '1.0.0',
				peerDependencies: { '@wordpress/theme': range },
			},
		},
		'packages/theme': {
			manifest: { name: '@wordpress/theme', version: themeVersion },
			changelog: theme,
		},
	} );

	test( 'flags a range excluding the current version', () => {
		expect(
			findRangeMismatches( workspaces( '<3.0.0', changelog( '' ) ) )
		).toHaveLength( 1 );
	} );

	test( 'flags a range excluding the next breaking version', () => {
		const breaking = changelog( '### Breaking Changes\n\n-   New.\n' );
		expect(
			findRangeMismatches( workspaces( '<4.0.0', breaking ) )
		).toHaveLength( 1 );
		expect(
			findRangeMismatches( workspaces( '<5.0.0', breaking ) )
		).toEqual( [] );
		expect(
			findRangeMismatches( workspaces( '<4.0.0', changelog( '' ) ) )
		).toEqual( [] );
	} );

	describe( 'with a prerelease target version', () => {
		const prerelease = '3.0.0-next.v.202609171837.0';
		const breaking = changelog( '### Breaking Changes\n\n-   New.\n' );

		test( 'checks the stable version it leads to', () => {
			expect(
				findRangeMismatches(
					workspaces( '^3.0.0', changelog( '' ), prerelease )
				)
			).toEqual( [] );
			expect(
				findRangeMismatches(
					workspaces( '<3.0.0', changelog( '' ), prerelease )
				)
			).toHaveLength( 1 );
		} );

		test( 'also checks the next breaking version', () => {
			expect(
				findRangeMismatches(
					workspaces( '^3.0.0', breaking, prerelease )
				)
			).toHaveLength( 1 );
			expect(
				findRangeMismatches(
					workspaces( '^3.0.0 || ^4.0.0', breaking, prerelease )
				)
			).toEqual( [] );
		} );
	} );
} );
