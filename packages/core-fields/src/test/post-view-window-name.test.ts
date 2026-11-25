import { describe, expect, it } from 'vitest';
import { getPostViewWindowName } from '../shared/post-view-window-name';

describe( 'getPostViewWindowName', () => {
	// `@wordpress/editor` keeps the same helper, pinned by the same assertion,
	// so that a post never opens in two different tabs. Change both or neither.
	it( 'namespaces the window name by post ID so each post reuses its own tab', () => {
		expect( getPostViewWindowName( 1234 ) ).toBe( 'wp-post-1234' );
		expect( getPostViewWindowName( 5678 ) ).toBe( 'wp-post-5678' );
	} );

	it( 'does not collide with the preview window name for the same post', () => {
		expect( getPostViewWindowName( 1234 ) ).not.toBe( 'wp-preview-1234' );
	} );
} );
