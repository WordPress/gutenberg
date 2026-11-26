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

	// Two sites on a subdirectory multisite share an origin and can both have a
	// post 123, so the site's own path tells them apart. It comes from the site
	// entity rather than the admin URL, which a plugin can move.
	it( 'keeps the plain name on a single site', () => {
		expect( getPostViewTarget( 1234, `${ origin }/hello/`, origin ) ).toBe(
			'wp-post-1234'
		);
		expect(
			getPostViewTarget( 1234, `${ origin }/hello/`, `${ origin }/` )
		).toBe( 'wp-post-1234' );
	} );

	it( 'includes the site so two multisite sites do not share a tab', () => {
		const a = getPostViewTarget(
			1234,
			`${ origin }/site-a/hello/`,
			`${ origin }/site-a`
		);
		const b = getPostViewTarget(
			1234,
			`${ origin }/site-b/hello/`,
			`${ origin }/site-b`
		);
		expect( a ).toBe( 'wp-post/site-a-1234' );
		expect( b ).toBe( 'wp-post/site-b-1234' );
		expect( a ).not.toBe( b );
	} );

	it( 'ignores a trailing slash on the site URL', () => {
		expect(
			getPostViewTarget(
				1234,
				`${ origin }/site-a/hello/`,
				`${ origin }/site-a/`
			)
		).toBe( 'wp-post/site-a-1234' );
	} );

	it( 'keeps the plain name when the site URL is unknown', () => {
		expect( getPostViewTarget( 1234, `${ origin }/hello/` ) ).toBe(
			'wp-post-1234'
		);
		expect(
			getPostViewTarget( 1234, `${ origin }/hello/`, 'not a url' )
		).toBe( 'wp-post-1234' );
	} );

	it( 'falls back to a new tab for a URL it cannot parse', () => {
		expect( getPostViewTarget( 1234, 'http://%%%' ) ).toBe( '_blank' );
	} );
} );
