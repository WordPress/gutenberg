/**
 * External dependencies
 */
import { describe, expect, it } from '@jest/globals';

/**
 * Internal dependencies
 */
import {
	sanitizeValue,
	sanitizeObjectData,
	sanitizeRemoteChanges,
} from '../sanitize';

describe( 'sanitize', () => {
	describe( 'sanitizeValue', () => {
		it( 'strips script tags from strings', () => {
			expect(
				sanitizeValue( '<script>alert("xss")</script>Hello' )
			).toBe( 'Hello' );
		} );

		it( 'strips event handler attributes', () => {
			expect( sanitizeValue( '<img src="x" onerror="alert(1)">' ) ).toBe(
				'<img src="x">'
			);
		} );

		it( 'preserves safe HTML', () => {
			const safeHtml =
				'<p>Hello <strong>world</strong> <a href="https://example.com">link</a></p>';
			expect( sanitizeValue( safeHtml ) ).toBe( safeHtml );
		} );

		it( 'preserves plain strings without HTML', () => {
			expect( sanitizeValue( 'publish' ) ).toBe( 'publish' );
			expect( sanitizeValue( 'Hello World' ) ).toBe( 'Hello World' );
			expect( sanitizeValue( '' ) ).toBe( '' );
		} );

		it( 'preserves HTML comments', () => {
			const input =
				'<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->';
			expect( sanitizeValue( input ) ).toBe( input );
		} );

		it( 'passes through numbers unchanged', () => {
			expect( sanitizeValue( 42 ) ).toBe( 42 );
			expect( sanitizeValue( 0 ) ).toBe( 0 );
		} );

		it( 'passes through booleans unchanged', () => {
			expect( sanitizeValue( true ) ).toBe( true );
			expect( sanitizeValue( false ) ).toBe( false );
		} );

		it( 'passes through null and undefined unchanged', () => {
			expect( sanitizeValue( null ) ).toBe( null );
			expect( sanitizeValue( undefined ) ).toBe( undefined );
		} );

		it( 'recursively sanitizes arrays', () => {
			const input = [
				'<script>alert(1)</script>safe',
				42,
				'<b>bold</b>',
			];
			expect( sanitizeValue( input ) ).toEqual( [
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
			expect( sanitizeValue( input ) ).toEqual( {
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
			expect( sanitizeValue( instance ) ).toBe( instance );
		} );
	} );

	describe( 'sanitizeObjectData', () => {
		it( 'sanitizes all string values in a flat record', () => {
			const input = {
				title: '<script>xss</script>Title',
				status: 'publish',
				id: 123,
			};
			const result = sanitizeObjectData( input );
			expect( result ).toEqual( {
				title: 'Title',
				status: 'publish',
				id: 123,
			} );
		} );

		it( 'returns a new object', () => {
			const input = { title: 'Hello' };
			const result = sanitizeObjectData( input );
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

			const result = sanitizeRemoteChanges( changes );

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

			const result = sanitizeRemoteChanges( changes );
			const blocks = result.blocks as Array< Record< string, unknown > >;
			const attrs = blocks[ 0 ].attributes as Record< string, unknown >;
			expect( attrs.content ).toBe( 'Safe text' );
		} );
	} );
} );
