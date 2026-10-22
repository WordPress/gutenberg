import { describe, expect, test } from 'vitest';
import { findStaleWorkspacePeerRanges } from './check-workspace-peer-ranges.ts';

describe( 'findStaleWorkspacePeerRanges', () => {
	test( 'accepts a range that includes the current version', () => {
		expect(
			findStaleWorkspacePeerRanges( [
				{ name: '@wordpress/theme', version: '3.0.0' },
				{
					name: '@wordpress/build',
					version: '0.26.0',
					peerDependencies: { '@wordpress/theme': '>=0.8.0 <4.0.0' },
				},
			] )
		).toEqual( [] );
	} );

	test( 'reports a range that excludes the current version', () => {
		expect(
			findStaleWorkspacePeerRanges( [
				{ name: '@wordpress/theme', version: '3.0.0' },
				{
					name: '@wordpress/build',
					version: '0.26.0',
					peerDependencies: { '@wordpress/theme': '>=0.8.0 <3.0.0' },
				},
			] )
		).toEqual( [
			{
				workspace: '@wordpress/build',
				peer: '@wordpress/theme',
				range: '>=0.8.0 <3.0.0',
				version: '3.0.0',
			},
		] );
	} );

	test( 'ignores peers that are not workspaces', () => {
		expect(
			findStaleWorkspacePeerRanges( [
				{
					name: '@wordpress/example',
					version: '1.0.0',
					peerDependencies: { react: '^18.0.0' },
				},
			] )
		).toEqual( [] );
	} );

	test( 'ignores specifiers that are not semver ranges', () => {
		expect(
			findStaleWorkspacePeerRanges( [
				{ name: '@wordpress/theme', version: '3.0.0' },
				{
					name: '@wordpress/build',
					peerDependencies: { '@wordpress/theme': 'file:../theme' },
				},
			] )
		).toEqual( [] );
	} );

	test( 'treats a prerelease version as matching its release range', () => {
		expect(
			findStaleWorkspacePeerRanges( [
				{ name: '@wordpress/theme', version: '3.0.0-rc.1' },
				{
					name: '@wordpress/build',
					peerDependencies: { '@wordpress/theme': '^3.0.0-rc.0' },
				},
			] )
		).toEqual( [] );
	} );
} );
