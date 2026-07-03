/**
 * Internal dependencies
 */
import {
	getNpmReleaseGitRecoveryCommands,
	getTagPushCommands,
	getTagRefspec,
} from '../packages';

describe( 'getTagRefspec', () => {
	it( 'returns a fully qualified package tag refspec', () => {
		expect( getTagRefspec( '@wordpress/a11y@4.50.0' ) ).toBe(
			'refs/tags/@wordpress/a11y@4.50.0:refs/tags/@wordpress/a11y@4.50.0'
		);
	} );
} );

describe( 'getTagPushCommands', () => {
	it( 'quotes fully qualified tag refspecs', () => {
		expect(
			getTagPushCommands( [
				'@wordpress/a11y@4.50.0',
				'@wordpress/blocks@14.20.0',
			] )
		).toEqual( [
			[
				'git push origin \\',
				'  "refs/tags/@wordpress/a11y@4.50.0:refs/tags/@wordpress/a11y@4.50.0" \\',
				'  "refs/tags/@wordpress/blocks@14.20.0:refs/tags/@wordpress/blocks@14.20.0"',
			].join( '\n' ),
		] );
	} );
} );

describe( 'getNpmReleaseGitRecoveryCommands', () => {
	it( 'includes branch, tag push, and tag verification commands', () => {
		const commands = getNpmReleaseGitRecoveryCommands( {
			npmReleaseBranch: 'wp/latest',
			packageTags: [ '@wordpress/a11y@4.50.0' ],
			publishCommit: 'abc123',
		} );

		expect( commands ).toContain( 'git push origin \\' );
		expect( commands ).toContain(
			'"refs/tags/@wordpress/a11y@4.50.0:refs/tags/@wordpress/a11y@4.50.0"'
		);
		expect( commands ).toContain(
			'git push origin "abc123:refs/heads/wp/latest"'
		);
		expect( commands ).toContain(
			'git ls-remote --tags origin "refs/tags/@wordpress/a11y@4.50.0" "refs/tags/@wordpress/a11y@4.50.0^{}"'
		);
	} );
} );
