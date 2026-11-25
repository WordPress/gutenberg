import { describe, expect, it } from 'vitest';
import { getPostViewWindowName } from '../post-view-window-name';

describe( 'getPostViewWindowName', () => {
	it( 'namespaces the window name by post ID so each post reuses its own tab', () => {
		expect( getPostViewWindowName( 1234 ) ).toBe( 'wp-post-1234' );
		expect( getPostViewWindowName( 5678 ) ).toBe( 'wp-post-5678' );
	} );

	it( 'does not collide with the preview window name for the same post', () => {
		expect( getPostViewWindowName( 1234 ) ).not.toBe( 'wp-preview-1234' );
	} );

	it( 'accepts a string ID, as used by post types with string IDs', () => {
		expect( getPostViewWindowName( 'theme//index' ) ).toBe(
			'wp-post-theme//index'
		);
	} );
} );
