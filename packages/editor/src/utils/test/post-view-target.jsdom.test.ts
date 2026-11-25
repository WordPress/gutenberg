import { describe, expect, it } from 'vitest';
import { getPostViewTarget } from '../post-view-target';

const origin = window.location.origin;

describe( 'getPostViewTarget', () => {
	it( 'names a window per post, so each post reuses its own tab', () => {
		expect( getPostViewTarget( 1234, `${ origin }/hello/` ) ).toBe(
			'wp-post-1234'
		);
		expect( getPostViewTarget( 5678, `${ origin }/hello/` ) ).toBe(
			'wp-post-5678'
		);
	} );

	it( 'does not collide with the preview window of the same post', () => {
		expect( getPostViewTarget( 1234, `${ origin }/hello/` ) ).not.toBe(
			'wp-preview-1234'
		);
	} );

	it( 'names the window for a relative permalink', () => {
		expect( getPostViewTarget( 1234, '/hello/' ) ).toBe( 'wp-post-1234' );
	} );

	// A named target gets no implicit `noopener`, so a cross-origin page could
	// navigate the editor tab through `window.opener`. Plugins can filter the
	// permalink to any URL, so fall back to `_blank`, which implies `noopener`.
	it( 'falls back to a new tab for another origin', () => {
		expect( getPostViewTarget( 1234, 'https://example.com/hello/' ) ).toBe(
			'_blank'
		);
	} );

	it( 'falls back to a new tab for another port or scheme', () => {
		const { protocol, hostname } = window.location;
		const otherScheme = protocol === 'https:' ? 'http:' : 'https:';
		expect(
			getPostViewTarget( 1234, `${ otherScheme }//${ hostname }/hello/` )
		).toBe( '_blank' );
		expect(
			getPostViewTarget( 1234, `${ protocol }//${ hostname }:9999/x/` )
		).toBe( '_blank' );
	} );

	it( 'falls back to a new tab without an ID or a link', () => {
		expect( getPostViewTarget( undefined, `${ origin }/hello/` ) ).toBe(
			'_blank'
		);
		expect( getPostViewTarget( 1234, undefined ) ).toBe( '_blank' );
	} );

	it( 'falls back to a new tab for a URL it cannot parse', () => {
		expect( getPostViewTarget( 1234, 'http://%%%' ) ).toBe( '_blank' );
	} );
} );
