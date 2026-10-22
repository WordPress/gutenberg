import { describe, expect, test } from 'vitest';
import {
	findRangeMismatches,
	hasUnreleasedBreakingChanges,
	nextBreakingVersion,
} from './check-peer-version-ranges.ts';

const changelog = ( body: string ) =>
	`## Unreleased\n\n${ body }\n## 1.0.0 (2026-01-01)\n\n### Breaking Changes\n\n-   Old.\n`;

describe( 'hasUnreleasedBreakingChanges', () => {
	test( 'only looks at the Unreleased section', () => {
		expect( hasUnreleasedBreakingChanges( changelog( '' ) ) ).toBe( false );
		expect(
			hasUnreleasedBreakingChanges(
				changelog( '### Breaking Changes\n\n-   New.\n' )
			)
		).toBe( true );
	} );
} );

describe( 'nextBreakingVersion', () => {
	test( 'bumps the major, or the minor on 0.x', () => {
		expect( nextBreakingVersion( '3.1.0' ) ).toBe( '4.0.0' );
		expect( nextBreakingVersion( '0.8.2' ) ).toBe( '0.9.0' );
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
