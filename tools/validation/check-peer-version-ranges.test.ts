import { describe, expect, test } from 'vitest';
import {
	findRangeMismatches,
	nextReleaseVersion,
} from './check-peer-version-ranges.ts';

const changelog = ( body: string ) =>
	`## Unreleased\n\n${ body }\n## 1.0.0 (2026-01-01)\n\n### Breaking Changes\n\n-   Old.\n`;

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
	const workspaces = ( range: string, theme: string ) => ( {
		'packages/a': {
			manifest: {
				name: '@wordpress/a',
				version: '1.0.0',
				peerDependencies: { '@wordpress/theme': range },
			},
		},
		'packages/theme': {
			manifest: { name: '@wordpress/theme', version: '3.0.0' },
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
} );
