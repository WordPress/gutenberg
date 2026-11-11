import { describe, expect, it } from 'vitest';
import { getMediaLibraryUrlAfterDelete, isAdminReferrer } from '../navigation';

const CURRENT =
	'https://example.com/wp-admin/admin.php?page=media-editor-wp-admin&p=%2Fmedia-editor%2F12';

describe( 'isAdminReferrer', () => {
	it( 'accepts a page in the same wp-admin', () => {
		expect(
			isAdminReferrer(
				'https://example.com/wp-admin/upload.php',
				CURRENT
			)
		).toBe( true );
	} );

	it( 'rejects an empty referrer', () => {
		expect( isAdminReferrer( '', CURRENT ) ).toBe( false );
	} );

	it( 'rejects another site', () => {
		expect(
			isAdminReferrer(
				'https://example.org/wp-admin/upload.php',
				CURRENT
			)
		).toBe( false );
	} );

	it( 'rejects the front end of the same site', () => {
		expect(
			isAdminReferrer( 'https://example.com/hello-world/', CURRENT )
		).toBe( false );
	} );

	it( 'rejects a path that only starts like the admin directory', () => {
		expect(
			isAdminReferrer( 'https://example.com/wp-admin-old/', CURRENT )
		).toBe( false );
	} );

	it( 'accepts the admin of a site in a subdirectory', () => {
		expect(
			isAdminReferrer(
				'https://example.com/blog/wp-admin/upload.php',
				'https://example.com/blog/wp-admin/admin.php?page=media-editor-wp-admin'
			)
		).toBe( true );
	} );

	it( 'rejects an invalid URL', () => {
		expect( isAdminReferrer( 'not a url', CURRENT ) ).toBe( false );
	} );
} );

describe( 'getMediaLibraryUrlAfterDelete', () => {
	it( 'passes `deleted` after a permanent delete', () => {
		expect(
			getMediaLibraryUrlAfterDelete( 'permanently-delete', 12 )
		).toBe( 'upload.php?deleted=1' );
	} );

	it( 'passes `trashed` and the id after moving to the trash', () => {
		expect( getMediaLibraryUrlAfterDelete( 'move-to-trash', 12 ) ).toBe(
			'upload.php?trashed=1&ids=12'
		);
	} );
} );
