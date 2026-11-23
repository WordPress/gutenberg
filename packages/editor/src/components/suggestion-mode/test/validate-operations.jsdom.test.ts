/**
 * Validation of proposed attribute values against the block type.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
// Registers the filters that add the block supports' attributes.
import '@wordpress/block-editor';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';
import { findAttributeOperationProblem } from '../operations/validate';
import { hasDisallowedProtocol } from '../operations/url-scheme';

const GROUP = 'core/test-validate-group';
const BUTTON = 'core/test-validate-button';

const set = ( attribute: string, after: unknown ) => [
	{ type: 'attribute-set', attribute, before: null, after },
];

describe( 'findAttributeOperationProblem', () => {
	beforeAll( () => {
		registerBlockType( GROUP, {
			apiVersion: 3,
			attributes: {
				tagName: { type: 'string', default: 'div' },
				columns: { type: 'integer' },
				wide: { type: 'boolean' },
				images: { type: 'array' },
			},
			supports: {
				anchor: true,
				color: { background: true },
			},
			save: () => null,
			category: 'design',
			title: 'Test Validate Group',
		} as any );
		registerBlockType( BUTTON, {
			apiVersion: 3,
			attributes: {
				tagName: {
					type: 'string',
					enum: [ 'a', 'button' ],
					default: 'a',
				},
				url: {
					type: 'string',
					source: 'attribute',
					selector: 'a',
					attribute: 'href',
				},
				target: {
					type: 'string',
					source: 'attribute',
					selector: 'a',
					attribute: 'href',
				},
				text: { type: 'rich-text', source: 'rich-text' },
			},
			save: () => null,
			category: 'design',
			title: 'Test Validate Button',
		} as any );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	it( 'accepts declared attributes, including the ones block supports add', () => {
		expect(
			findAttributeOperationProblem( GROUP, [
				...set( 'tagName', 'section' ),
				...set( 'columns', 3 ),
				...set( 'wide', true ),
				...set( 'anchor', 'intro' ),
				...set( 'className', 'is-style-wide' ),
				...set( 'backgroundColor', 'primary' ),
				...set( 'style', { color: { background: '#fff' } } ),
				...set( 'lock', { move: true } ),
				...set( 'metadata', { name: 'Hero' } ),
			] )
		).toBeNull();
	} );

	it( 'accepts an unset value, which restores the default', () => {
		expect(
			findAttributeOperationProblem( GROUP, set( 'tagName', null ) )
		).toBeNull();
	} );

	it( 'ignores operations that set no attribute', () => {
		expect(
			findAttributeOperationProblem( 'core/not-registered', [
				{ type: 'block-remove' },
				{ type: 'inline-suggestion', attribute: 'content' },
			] )
		).toBeNull();
	} );

	it( 'refuses a block type that is not registered', () => {
		expect(
			findAttributeOperationProblem(
				'core/not-registered',
				set( 'content', 'x' )
			)
		).toBe( 'unknown-block-type' );
	} );

	it( 'refuses an attribute the block type does not declare', () => {
		expect(
			findAttributeOperationProblem( GROUP, set( 'notDeclared', 'x' ) )
		).toBe( 'unknown-attribute' );
		// Inherited object keys are not declarations.
		expect(
			findAttributeOperationProblem( GROUP, set( 'constructor', 'x' ) )
		).toBe( 'unknown-attribute' );
	} );

	it.each( [
		[ 'columns', '3' ],
		[ 'columns', 2.5 ],
		[ 'wide', 'yes' ],
		[ 'tagName', { toString: 'script' } ],
		[ 'images', { 0: 'x' } ],
		[ 'style', 'color:red' ],
	] )(
		'refuses %s set to a value of the wrong type',
		( attribute, after ) => {
			expect(
				findAttributeOperationProblem( GROUP, set( attribute, after ) )
			).toBe( 'invalid-value' );
		}
	);

	it( 'honours a declared enum', () => {
		expect(
			findAttributeOperationProblem( BUTTON, set( 'tagName', 'button' ) )
		).toBeNull();
		expect(
			findAttributeOperationProblem( BUTTON, set( 'tagName', 'script' ) )
		).toBe( 'invalid-value' );
	} );

	it.each( [
		'script',
		'SCRIPT',
		'iframe',
		'style',
		'x-widget',
		'div onload',
	] )( 'refuses the tag name %s where no enum is declared', ( tagName ) => {
		expect(
			findAttributeOperationProblem( GROUP, set( 'tagName', tagName ) )
		).toBe( 'unsafe-value' );
	} );

	it.each( [
		'javascript:alert(1)',
		' JaVa\tScript:alert(1)',
		'data:text/html,<script>alert(1)</script>',
		'vbscript:x',
	] )( 'refuses the URL %s', ( url ) => {
		expect(
			findAttributeOperationProblem( BUTTON, set( 'url', url ) )
		).toBe( 'unsafe-value' );
		// Named for something else, but read from `href`.
		expect(
			findAttributeOperationProblem( BUTTON, set( 'target', url ) )
		).toBe( 'unsafe-value' );
	} );

	it( 'refuses a disallowed URL nested in a structured value', () => {
		expect(
			findAttributeOperationProblem(
				GROUP,
				set( 'images', [ { id: 1, fullUrl: 'javascript:alert(1)' } ] )
			)
		).toBe( 'unsafe-value' );
		expect(
			findAttributeOperationProblem(
				GROUP,
				set( 'style', {
					background: {
						backgroundImage: { url: 'javascript:alert(1)' },
					},
				} )
			)
		).toBe( 'unsafe-value' );
	} );

	it( 'accepts allowed, relative and fragment URLs', () => {
		for ( const url of [
			'https://example.org/a?b=c',
			'mailto:someone@example.org',
			'/about',
			'#top',
		] ) {
			expect(
				findAttributeOperationProblem( BUTTON, set( 'url', url ) )
			).toBeNull();
		}
	} );

	it( 'does not read text as a URL', () => {
		expect(
			findAttributeOperationProblem(
				BUTTON,
				set( 'text', 'Note: read this first' )
			)
		).toBeNull();
	} );

	it.each( [
		{ color: { background: 'red;position:fixed;inset:0' } },
		{ color: { background: 'url(https://example.org/track)' } },
		{ spacing: { padding: { top: '1px} body{display:none' } } },
		{ typography: { fontSize: '1rem/* x */' } },
	] )( 'refuses a style value that leaves its declaration', ( style ) => {
		expect(
			findAttributeOperationProblem( GROUP, set( 'style', style ) )
		).toBe( 'unsafe-value' );
	} );

	it.each( [
		"https://example.org/a.png');color:red;background:url('x",
		'https://example.org/a.png"',
		'https://example.org/a.png;color:red',
		'https://example.org/a.png}body{color:red',
		'https://example.org/a\\27 .png',
		'https://example.org/a.png\ncolor:red',
		'https://example.org/a.png</style>',
	] )( 'refuses the style URL %s, which leaves its declaration', ( url ) => {
		expect(
			findAttributeOperationProblem(
				GROUP,
				set( 'style', {
					background: { backgroundImage: { url } },
				} )
			)
		).toBe( 'unsafe-value' );
	} );

	it( 'accepts ordinary style URLs', () => {
		for ( const url of [
			'https://example.org/a.png?w=1&h=2',
			'/wp-content/uploads/a b (1).png',
			'https://example.org/wiki/File:A_(b).png#c',
		] ) {
			expect(
				findAttributeOperationProblem(
					GROUP,
					set( 'style', {
						background: { backgroundImage: { url } },
					} )
				)
			).toBeNull();
		}
	} );

	it( 'accepts ordinary style values', () => {
		expect(
			findAttributeOperationProblem(
				GROUP,
				set( 'style', {
					color: {
						background: 'var:preset|color|primary',
						gradient:
							'linear-gradient(135deg,rgb(6,147,227) 0%,rgb(155,81,224) 100%)',
					},
					spacing: { padding: { top: 'clamp(1rem, 2vw, 3rem)' } },
					dimensions: { aspectRatio: '16/9' },
					background: {
						backgroundImage: { url: 'https://example.org/a.png' },
					},
				} )
			)
		).toBeNull();
	} );

	it( 'refuses custom CSS the block does not already have', () => {
		const style = { css: 'color: red;', color: { text: '#000' } };
		expect(
			findAttributeOperationProblem( GROUP, set( 'style', style ) )
		).toBe( 'unsafe-value' );
		expect(
			findAttributeOperationProblem(
				GROUP,
				set( 'style', { ':hover': { css: 'color: red;' } } ),
				{ style: {} }
			)
		).toBe( 'unsafe-value' );
		// Carried along unchanged with another style edit.
		expect(
			findAttributeOperationProblem( GROUP, set( 'style', style ), {
				style: { css: 'color: red;' },
			} )
		).toBeNull();
	} );

	it( 'refuses a metadata proposal that names a system key', () => {
		expect(
			findAttributeOperationProblem(
				GROUP,
				set( 'metadata', { name: 'Hero', noteId: [ 9 ] } )
			)
		).toBe( 'invalid-value' );
		expect(
			findAttributeOperationProblem(
				GROUP,
				set( 'metadata', { suggestion: { type: 'pending-remove' } } )
			)
		).toBe( 'invalid-value' );
	} );

	it( 'reports the first problem and repairs nothing', () => {
		const operations = [
			...set( 'columns', 3 ),
			...set( 'tagName', 'script' ),
		];
		const copy = JSON.parse( JSON.stringify( operations ) );
		expect( findAttributeOperationProblem( GROUP, operations ) ).toBe(
			'unsafe-value'
		);
		expect( operations ).toEqual( copy );
	} );
} );

describe( 'hasDisallowedProtocol', () => {
	it( 'allows the default WordPress protocols and schemeless values', () => {
		expect( hasDisallowedProtocol( 'https://example.org' ) ).toBe( false );
		expect( hasDisallowedProtocol( 'TEL:+123' ) ).toBe( false );
		expect( hasDisallowedProtocol( 'page.html?a=b:c' ) ).toBe( false );
	} );

	it( 'sees through whitespace and control characters in a scheme', () => {
		expect( hasDisallowedProtocol( 'java\nscript:alert(1)' ) ).toBe( true );
		expect( hasDisallowedProtocol( '\u0001javascript:alert(1)' ) ).toBe(
			true
		);
	} );
} );
