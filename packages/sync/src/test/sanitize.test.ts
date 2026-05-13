/**
 * External dependencies
 */
import { beforeAll, describe, expect, it, jest } from '@jest/globals';

/**
 * Internal dependencies
 */
import type { KsesAllowedHtml } from '../types';

/**
 * Realistic subset of `wp_kses_allowed_html( 'post' )`. Mirrors the structure
 * the PHP side injects via `window._wpCollaborationKsesHtml`.
 */
const KSES_ALLOWED_HTML: KsesAllowedHtml = {
	a: { href: true, rel: true, target: true, title: true },
	p: { class: true },
	strong: {},
	em: {},
	b: {},
	i: {},
	br: {},
	img: { src: true, alt: true, width: true, height: true },
	ul: {},
	ol: {},
	li: {},
	h1: {},
	h2: {},
	h3: {},
	h4: {},
	h5: {},
	h6: {},
	blockquote: {},
	code: {},
	pre: {},
	div: { class: true },
	span: { class: true },
	iframe: {
		src: true,
		srcdoc: true,
		sandbox: true,
		width: true,
		height: true,
	},
};

interface SanitizeModule {
	sanitizeValue: ( value: unknown ) => unknown;
	sanitizeObjectData: < T extends Record< string, unknown > >(
		changes: T
	) => T;
	sanitizeRemoteChanges: (
		changes: Record< string, unknown >
	) => Record< string, unknown >;
}

let sanitize: SanitizeModule;

beforeAll( () => {
	window._wpCollaborationKsesHtml = KSES_ALLOWED_HTML;
	jest.isolateModules( () => {
		sanitize = require( '../sanitize' ) as SanitizeModule;
	} );
} );

describe( 'sanitize', () => {
	describe( 'sanitizeValue', () => {
		it( 'strips script tags from strings', () => {
			expect(
				sanitize.sanitizeValue( '<script>alert("xss")</script>Hello' )
			).toBe( 'Hello' );
		} );

		it( 'strips event handler attributes', () => {
			expect(
				sanitize.sanitizeValue( '<img src="x" onerror="alert(1)">' )
			).toBe( '<img src="x">' );
		} );

		it( 'preserves safe HTML', () => {
			const safeHtml =
				'<p>Hello <strong>world</strong> <a href="https://example.com">link</a></p>';
			expect( sanitize.sanitizeValue( safeHtml ) ).toBe( safeHtml );
		} );

		it( 'preserves plain strings without HTML', () => {
			expect( sanitize.sanitizeValue( 'publish' ) ).toBe( 'publish' );
			expect( sanitize.sanitizeValue( 'Hello World' ) ).toBe(
				'Hello World'
			);
			expect( sanitize.sanitizeValue( '' ) ).toBe( '' );
		} );

		it( 'preserves HTML comments (block delimiters)', () => {
			const input =
				'<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->';
			expect( sanitize.sanitizeValue( input ) ).toBe( input );
		} );

		it( 'passes through numbers unchanged', () => {
			expect( sanitize.sanitizeValue( 42 ) ).toBe( 42 );
			expect( sanitize.sanitizeValue( 0 ) ).toBe( 0 );
		} );

		it( 'passes through booleans unchanged', () => {
			expect( sanitize.sanitizeValue( true ) ).toBe( true );
			expect( sanitize.sanitizeValue( false ) ).toBe( false );
		} );

		it( 'passes through null and undefined unchanged', () => {
			expect( sanitize.sanitizeValue( null ) ).toBe( null );
			expect( sanitize.sanitizeValue( undefined ) ).toBe( undefined );
		} );

		it( 'recursively sanitizes arrays', () => {
			const input = [
				'<script>alert(1)</script>safe',
				42,
				'<b>bold</b>',
			];
			expect( sanitize.sanitizeValue( input ) ).toEqual( [
				'safe',
				42,
				'<b>bold</b>',
			] );
		} );

		it( 'recursively sanitizes nested objects', () => {
			const input = {
				title: '<script>alert(1)</script>Hello',
				count: 5,
				nested: {
					content: '<img src=x onerror=alert(1)>',
				},
			};
			expect( sanitize.sanitizeValue( input ) ).toEqual( {
				title: 'Hello',
				count: 5,
				nested: {
					content: '<img src="x">',
				},
			} );
		} );

		it( 'does not recurse into class instances', () => {
			class Custom {
				malicious = '<script>alert(1)</script>';
			}
			const instance = new Custom();
			expect( sanitize.sanitizeValue( instance ) ).toBe( instance );
		} );
	} );

	describe( 'kses-post bypass coverage', () => {
		it( 'strips javascript: URIs from anchor href', () => {
			const result = sanitize.sanitizeValue(
				'<a href="javascript:alert(1)">click</a>'
			) as string;
			expect( result ).not.toContain( 'javascript:' );
			expect( result ).toContain( 'click' );
		} );

		it( 'strips javascript: URIs from form action', () => {
			const result = sanitize.sanitizeValue(
				'<form action="javascript:alert(1)"><button>x</button></form>'
			) as string;
			expect( result ).not.toContain( 'javascript:' );
		} );

		it( 'strips meta http-equiv refresh entirely (meta not allowed)', () => {
			const result = sanitize.sanitizeValue(
				'<meta http-equiv="refresh" content="0;url=javascript:alert(1)">Hello'
			) as string;
			expect( result ).not.toContain( '<meta' );
			expect( result ).not.toContain( 'http-equiv' );
			expect( result ).toContain( 'Hello' );
		} );

		it( 'strips base href entirely (base not allowed)', () => {
			const result = sanitize.sanitizeValue(
				'<base href="javascript:alert(1)//">Hello'
			) as string;
			expect( result ).not.toContain( '<base' );
			expect( result ).toContain( 'Hello' );
		} );

		it( 'strips inline style attributes that are not allowed per-tag', () => {
			// `p` does not have `style` in our test allowlist, only `class`.
			const result = sanitize.sanitizeValue(
				'<p style="background:url(javascript:alert(1))">x</p>'
			) as string;
			expect( result ).not.toContain( 'style' );
			expect( result ).not.toContain( 'javascript:' );
		} );

		it( 'strips disallowed attributes on allowed tags', () => {
			// `a` is allowed but only with href, rel, target, title.
			// `onclick` is not in the allowlist, and `data-evil` is not either.
			const result = sanitize.sanitizeValue(
				'<a href="https://example.com" onclick="alert(1)" data-evil="x">link</a>'
			) as string;
			expect( result ).not.toContain( 'onclick' );
			expect( result ).not.toContain( 'data-evil' );
			expect( result ).toContain( 'href="https://example.com"' );
		} );
	} );

	describe( 'sanitizeObjectData', () => {
		it( 'sanitizes all string values in a flat record', () => {
			const input = {
				title: '<script>xss</script>Title',
				status: 'publish',
				id: 123,
			};
			const result = sanitize.sanitizeObjectData( input );
			expect( result ).toEqual( {
				title: 'Title',
				status: 'publish',
				id: 123,
			} );
		} );

		it( 'returns a new object', () => {
			const input = { title: 'Hello' };
			const result = sanitize.sanitizeObjectData( input );
			expect( result ).not.toBe( input );
			expect( result ).toEqual( input );
		} );
	} );

	describe( 'sanitizeRemoteChanges', () => {
		it( 'sanitizes a realistic post changes object', () => {
			const changes = {
				title: 'Normal Title',
				content:
					'<p>Hello</p><script>document.cookie</script><p>World</p>',
				excerpt: '<img src=x onerror="fetch(\'https://evil.com\')">',
				status: 'draft',
				meta: {
					footnotes: '[]',
					custom_field: '<div onmouseover="alert(1)">hover me</div>',
				},
			};

			const result = sanitize.sanitizeRemoteChanges( changes );

			expect( result.title ).toBe( 'Normal Title' );
			expect( result.content ).toBe( '<p>Hello</p><p>World</p>' );
			expect( result.excerpt as string ).not.toContain( 'onerror' );
			expect( result.status ).toBe( 'draft' );
			expect(
				( result.meta as Record< string, unknown > ).custom_field
			).not.toContain( 'onmouseover' );
		} );

		it( 'sanitizes block attributes with XSS payloads', () => {
			const changes = {
				blocks: [
					{
						name: 'core/paragraph',
						attributes: {
							content: '<script>alert("xss")</script>Safe text',
						},
						innerBlocks: [],
					},
				],
			};

			const result = sanitize.sanitizeRemoteChanges( changes );
			const blocks = result.blocks as Array< Record< string, unknown > >;
			const attrs = blocks[ 0 ].attributes as Record< string, unknown >;
			expect( attrs.content ).toBe( 'Safe text' );
		} );
	} );
} );
