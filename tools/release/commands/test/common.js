import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const { calculateVersionBumpFromChangelog } = require( '../common' );

describe( 'calculateVersionBumpFromChangelog', () => {
	it.each( [
		'### Stable Release',
		'Note: This package is now a stable release.',
	] )(
		'promotes a pre-1.0 package using the Unreleased marker %s',
		( marker ) => {
			expect(
				calculateVersionBumpFromChangelog(
					[
						'## Unreleased',
						'### Breaking Changes',
						'- Update API.',
						marker,
						'## 0.25.0',
					],
					'patch',
					'0.25.0'
				)
			).toBe( 'major' );
		}
	);

	it( 'ignores promotion notes in published history and for stable packages', () => {
		expect(
			calculateVersionBumpFromChangelog(
				[
					'## Unreleased',
					'### Bug Fixes',
					'- Fix API.',
					'## 1.0.0',
					'Note: This package is now a stable release.',
				],
				'patch',
				'0.25.0'
			)
		).toBe( 'patch' );
		expect(
			calculateVersionBumpFromChangelog(
				[
					'## Unreleased',
					'Note: This package is now a stable release.',
				],
				'patch',
				'1.0.0'
			)
		).toBeNull();
	} );
	it( 'promotes to 1.0.0 when breaking changes precede Stable Release', () => {
		expect(
			calculateVersionBumpFromChangelog(
				[
					'## Unreleased',
					'### Breaking Changes',
					'- Update the API.',
					'### Documentation',
					'- Document the API.',
					'### Stable Release',
					'- Mark package as stable.',
					'## 0.24.0',
				],
				'patch',
				'0.24.0'
			)
		).toBe( 'major' );
	} );

	it( 'should return null when no lines provided', () => {
		expect( calculateVersionBumpFromChangelog( [] ) ).toBe( null );
	} );

	it( 'should return null when no unreleased header found', () => {
		expect(
			calculateVersionBumpFromChangelog( [
				'First line',
				'Second line',
				'Third line',
				'Fourth line',
				'Fifth line',
			] )
		).toBe( null );
	} );

	it( 'should return null when Unreleased header found but no entries', () => {
		expect(
			calculateVersionBumpFromChangelog( [
				'First line',
				'## Unreleased',
				'Third line',
				'Fourth line',
				'Fifth line',
			] )
		).toBe( null );
	} );

	it( 'should return patch version Unreleased header and new item detected', () => {
		expect(
			calculateVersionBumpFromChangelog( [
				'First line',
				'## Unreleased',
				'Third line',
				'  - new item added',
				'Fifth line',
			] )
		).toBe( 'patch' );
	} );

	it( 'should return enforce higher version bump when new item detected with lower level', () => {
		expect(
			calculateVersionBumpFromChangelog(
				[
					'First line',
					'## Unreleased',
					'Third line',
					'  - new item added',
					'Fifth line',
				],
				'major'
			)
		).toBe( 'major' );
	} );

	it( 'should return major version bump when breaking changes detected', () => {
		expect(
			calculateVersionBumpFromChangelog( [
				'First line',
				'## Unreleased',
				'### Breaking Changes',
				'  - new item added',
				'Fifth line',
			] )
		).toBe( 'major' );
	} );

	it( 'should have no effect to use stable release heading on stable package', () => {
		expect(
			calculateVersionBumpFromChangelog(
				[
					'First line',
					'## Unreleased',
					'### Stable Release',
					'This package is now considered stable.',
					'Fifth line',
				],
				'patch',
				'1.0.0'
			)
		).toBe( 'patch' );
	} );

	describe( 'prerelease versions', () => {
		it( 'should not bump the major even if breaking changes detected', () => {
			expect(
				calculateVersionBumpFromChangelog(
					[
						'First line',
						'## Unreleased',
						'### Breaking Changes',
						'  - new item added',
						'Fifth line',
					],
					'patch',
					'0.1.0'
				)
			).toBe( 'minor' );
		} );

		it( 'should bump the major when stable release heading detected', () => {
			expect(
				calculateVersionBumpFromChangelog(
					[
						'First line',
						'## Unreleased',
						'### Stable Release',
						'This package is now considered stable.',
						'Fifth line',
					],
					'patch',
					'0.1.0'
				)
			).toBe( 'major' );
		} );
	} );
} );
