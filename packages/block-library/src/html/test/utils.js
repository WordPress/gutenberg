/**
 * Internal dependencies
 */
import { parseContent, serializeContent } from '../utils';

describe( 'core/html', () => {
	describe( 'parseContent()', () => {
		it( 'should parse empty content', () => {
			const result = parseContent( '' );
			expect( result ).toEqual( { html: '', css: '', js: '' } );
		} );

		it( 'should parse whitespace-only content', () => {
			const result = parseContent( '   \n\t  ' );
			expect( result ).toEqual( { html: '', css: '', js: '' } );
		} );

		it( 'should parse HTML-only content', () => {
			const content = '<p>Hello World</p>';
			const result = parseContent( content );
			expect( result ).toEqual( {
				html: '<p>Hello World</p>',
				css: '',
				js: '',
			} );
		} );

		it( 'should parse CSS-only content', () => {
			const content =
				'<style data-wp-block-html="css">body { color: red; }</style>';
			const result = parseContent( content );
			expect( result ).toEqual( {
				html: '',
				css: 'body { color: red; }',
				js: '',
			} );
		} );

		it( 'should parse JavaScript-only content', () => {
			const content =
				'<script data-wp-block-html="js">console.log("hello");</script>';
			const result = parseContent( content );
			expect( result ).toEqual( {
				html: '',
				css: '',
				js: 'console.log("hello");',
			} );
		} );

		it( 'should parse content with all three sections', () => {
			const content = `<style data-wp-block-html="css">
body { color: red; }
</style>

<script data-wp-block-html="js">
console.log("hello");
</script>

<p>Hello World</p>`;
			const result = parseContent( content );
			expect( result.css ).toBe( 'body { color: red; }' );
			expect( result.js ).toBe( 'console.log("hello");' );
			expect( result.html ).toBe( '<p>Hello World</p>' );
		} );

		it( 'should ignore unmarked style tags', () => {
			const content = `<style>body { color: blue; }</style>
<style data-wp-block-html="css">body { color: red; }</style>
<p>Test</p>`;
			const result = parseContent( content );
			expect( result.css ).toBe( 'body { color: red; }' );
			expect( result.html ).toContain(
				'<style>body { color: blue; }</style>'
			);
		} );

		it( 'should ignore unmarked script tags', () => {
			const content = `<script>alert("unmarked");</script>
<script data-wp-block-html="js">console.log("marked");</script>
<p>Test</p>`;
			const result = parseContent( content );
			expect( result.js ).toBe( 'console.log("marked");' );
			expect( result.html ).toContain(
				'<script>alert("unmarked");</script>'
			);
		} );

		it( 'should handle multiple marked style tags (takes first)', () => {
			const content = `<style data-wp-block-html="css">first</style>
<style data-wp-block-html="css">second</style>`;
			const result = parseContent( content );
			expect( result.css ).toBe( 'first' );
			expect( result.html ).toContain( 'second' );
		} );

		it( 'should handle multiple marked script tags (takes first)', () => {
			const content = `<script data-wp-block-html="js">first</script>
<script data-wp-block-html="js">second</script>`;
			const result = parseContent( content );
			expect( result.js ).toBe( 'first' );
			expect( result.html ).toContain( 'second' );
		} );

		it( 'should trim whitespace from extracted sections', () => {
			const content = `<style data-wp-block-html="css">

  body { color: red; }

</style>

<script data-wp-block-html="js">

  console.log("test");

</script>

  <p>Test</p>  `;
			const result = parseContent( content );
			expect( result.css ).toBe( 'body { color: red; }' );
			expect( result.js ).toBe( 'console.log("test");' );
			expect( result.html ).toBe( '<p>Test</p>' );
		} );

		it( 'should handle malformed HTML gracefully', () => {
			const content = '<p>Unclosed tag<div>Test</p>';
			const result = parseContent( content );
			expect( result ).toHaveProperty( 'html' );
			expect( result ).toHaveProperty( 'css' );
			expect( result ).toHaveProperty( 'js' );
		} );
	} );

	describe( 'serializeContent()', () => {
		it( 'should serialize empty sections', () => {
			const result = serializeContent( { html: '', css: '', js: '' } );
			expect( result ).toBe( '' );
		} );

		it( 'should serialize HTML-only', () => {
			const result = serializeContent( {
				html: '<p>Hello World</p>',
				css: '',
				js: '',
			} );
			expect( result ).toBe( '<p>Hello World</p>' );
		} );

		it( 'should serialize CSS-only', () => {
			const result = serializeContent( {
				html: '',
				css: 'body { color: red; }',
				js: '',
			} );
			expect( result ).toBe(
				'<style data-wp-block-html="css">\nbody { color: red; }\n</style>'
			);
		} );

		it( 'should serialize JavaScript-only', () => {
			const result = serializeContent( {
				html: '',
				css: '',
				js: 'console.log("test");',
			} );
			expect( result ).toBe(
				'<script data-wp-block-html="js">\nconsole.log("test");\n</script>'
			);
		} );

		it( 'should serialize all three sections in correct order', () => {
			const result = serializeContent( {
				html: '<p>Hello</p>',
				css: 'body { color: red; }',
				js: 'console.log("test");',
			} );
			expect( result ).toBe(
				'<style data-wp-block-html="css">\nbody { color: red; }\n</style>\n\n<script data-wp-block-html="js">\nconsole.log("test");\n</script>\n\n<p>Hello</p>'
			);
		} );

		it( 'should ignore whitespace-only sections', () => {
			const result = serializeContent( {
				html: '<p>Test</p>',
				css: '   \n  ',
				js: '\t\t',
			} );
			expect( result ).toBe( '<p>Test</p>' );
		} );

		it( 'should handle missing properties gracefully', () => {
			const result = serializeContent( {} );
			expect( result ).toBe( '' );
		} );

		it( 'should handle undefined values', () => {
			const result = serializeContent( {
				html: undefined,
				css: undefined,
				js: undefined,
			} );
			expect( result ).toBe( '' );
		} );
	} );

	describe( 'round-trip serialization', () => {
		it( 'should maintain HTML-only content', () => {
			const original = '<p>Hello World</p>';
			const parsed = parseContent( original );
			const serialized = serializeContent( parsed );
			expect( serialized ).toBe( original );
		} );

		it( 'should maintain content with all sections', () => {
			const original =
				'<style data-wp-block-html="css">\nbody { color: red; }\n</style>\n\n<script data-wp-block-html="js">\nconsole.log("test");\n</script>\n\n<p>Hello</p>';
			const parsed = parseContent( original );
			const serialized = serializeContent( parsed );
			expect( serialized ).toBe( original );
		} );

		it( 'should maintain complex HTML structures', () => {
			const sections = {
				html: '<div><h1>Title</h1><p>Paragraph</p></div>',
				css: 'h1 { font-size: 2em; }',
				js: 'document.addEventListener("load", () => {});',
			};
			const serialized = serializeContent( sections );
			const parsed = parseContent( serialized );
			expect( parsed.html ).toBe( sections.html );
			expect( parsed.css ).toBe( sections.css );
			expect( parsed.js ).toBe( sections.js );
		} );
	} );
} );
