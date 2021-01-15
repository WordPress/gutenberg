/**
 * Internal dependencies
 */
import { calculateVersionBumpFromChangelog } from '../common';

describe( 'calculateVersionBumpFromChangelog', () => {
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
			calculateVersionBumpFromChangelog(
				[
					'First line',
					'## Unreleased',
					'### Breaking Changes',
					'  - new item added',
					'Fifth line',
				],
				'major'
			)
		).toBe( 'major' );
	} );
} );
