/**
 * External dependencies
 */
import { h } from 'preact';
import type { VNode } from 'preact';

/**
 * Internal dependencies
 */
import { toVdom, hydratedIslands } from '../vdom';

function createElementFromHTML( html: string ): HTMLElement {
	const div = document.createElement( 'div' );
	div.innerHTML = html.trim();
	return div.firstChild as HTMLElement;
}

const normalizeVNode = ( obj: object ) =>
	JSON.stringify( obj ).replace( /"__v":\d+/g, '"__v":null' );

expect.extend( {
	toMatchVNode( received: VNode, expected: VNode ) {
		const pass = normalizeVNode( received ) === normalizeVNode( expected );
		return {
			pass,
			message: () =>
				pass ? "Expected VNodes don't match" : 'Expected VNode match',
		};
	},
} );

describe( 'toVdom', () => {
	beforeEach( () => {
		// @ts-ignore - Accessing private property for testing.
		hydratedIslands._values = new WeakMap();
	} );

	describe( 'Basic node types', () => {
		it( 'should convert text nodes to strings', () => {
			const textNode = createElementFromHTML( 'Hello World' );
			expect( toVdom( textNode ) ).toMatchVNode( 'Hello World' );
		} );

		it( 'should convert element nodes to vDOM elements', () => {
			const element = createElementFromHTML( '<div></div>' );
			expect( toVdom( element ) ).toMatchVNode( h( 'div', null, [] ) );
		} );

		it( 'should handle nested elements', () => {
			const element = createElementFromHTML(
				'<div><span>Test 1</span>Test 2</div>'
			);
			expect( toVdom( element ) ).toMatchVNode(
				h( 'div', null, [ h( 'span', null, [ 'Test 1' ] ), 'Test 2' ] )
			);
		} );

		it( 'should convert CDATA sections to text nodes and continue to their siblings', () => {
			const parser = new DOMParser();
			const xml = parser.parseFromString(
				'<div>Test 1<![CDATA[CDATA content]]>Test 2</div>',
				'application/xml'
			);
			expect( toVdom( xml.querySelector( 'div' ) as Node ) ).toMatchVNode(
				h( 'div', null, [ 'Test 1', 'CDATA content', 'Test 2' ] )
			);
			expect( xml.querySelector( 'div' )?.outerHTML ).toBe(
				'<div>Test 1CDATA contentTest 2</div>'
			);
		} );

		it( 'should convert CDATA sections to text nodes and continue to their parent', () => {
			const parser = new DOMParser();
			const xml = parser.parseFromString(
				'<div><div>Test 1<![CDATA[CDATA content]]></div><div>Test 2</div></div>',
				'application/xml'
			);
			expect( toVdom( xml.querySelector( 'div' ) as Node ) ).toMatchVNode(
				h( 'div', null, [
					h( 'div', null, [ 'Test 1', 'CDATA content' ] ),
					h( 'div', null, [ 'Test 2' ] ),
				] )
			);
			expect( xml.querySelector( 'div' )?.outerHTML ).toBe(
				'<div><div>Test 1CDATA content</div><div>Test 2</div></div>'
			);
		} );

		it( 'should remove comment nodes and continue to their siblings', () => {
			const container = createElementFromHTML(
				'<div>Test 1<!-- This is a comment --><div>Test 2</div></div>'
			);
			expect( toVdom( container ) ).toMatchVNode(
				h( 'div', null, [ 'Test 1', h( 'div', null, [ 'Test 2' ] ) ] )
			);
			expect( container.outerHTML ).toBe(
				'<div>Test 1<div>Test 2</div></div>'
			);
		} );

		it( 'should remove multiple comment nodes', () => {
			const container = createElementFromHTML(
				'<div><div>Test 1<!-- This is a comment --><!-- This is another comment --></div><div>Test 2</div></div>'
			);
			expect( toVdom( container ) ).toMatchVNode(
				h( 'div', null, [
					h( 'div', null, [ 'Test 1' ] ),
					h( 'div', null, [ 'Test 2' ] ),
				] )
			);
			expect( container.outerHTML ).toBe(
				'<div><div>Test 1</div><div>Test 2</div></div>'
			);
		} );

		it( 'should remove comment nodes and continue to their parents', () => {
			const container = createElementFromHTML(
				'<div><div>Test 1<!-- This is a comment --></div><div>Test 2</div></div>'
			);
			expect( toVdom( container ) ).toMatchVNode(
				h( 'div', null, [
					h( 'div', null, [ 'Test 1' ] ),
					h( 'div', null, [ 'Test 2' ] ),
				] )
			);
			expect( container.outerHTML ).toBe(
				'<div><div>Test 1</div><div>Test 2</div></div>'
			);
		} );

		it( 'should remove processing instruction nodes', () => {
			const parser = new DOMParser();
			const xml = parser.parseFromString(
				'<div><?xml-stylesheet type="text/css" href="style.css"?></div>',
				'application/xml'
			);
			expect( toVdom( xml.querySelector( 'div' ) as Node ) ).toMatchVNode(
				h( 'div', null, [] )
			);
			expect( xml.querySelector( 'div' )?.outerHTML ).toBe( '<div/>' );
		} );

		it( 'should handle template elements', () => {
			const template = createElementFromHTML(
				`<template>Test</template>`
			);
			expect( toVdom( template ) ).toMatchVNode(
				h(
					'template' as any,
					{
						content: [ 'Test' ],
					},
					[]
				)
			);
		} );

		it( 'should remove comment nodes inside templates', () => {
			const container = createElementFromHTML(
				'<div><!-- This is a comment --><template><div>Test 1<!-- This is a comment --></div></template></div>'
			);
			expect( toVdom( container ) ).toMatchVNode(
				h( 'div', null, [
					h(
						'template' as any,
						{
							content: [ h( 'div', null, [ 'Test 1' ] ) ],
						},
						[]
					),
				] )
			);
			expect( container.outerHTML ).toBe(
				'<div><template><div>Test 1</div></template></div>'
			);
		} );
	} );

	describe( 'Attribute handling', () => {
		it( 'should properly parse regular HTML attributes', () => {
			const element = createElementFromHTML(
				'<div id="test-id" class="test-class" data-test="test-value"></div>'
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						id: 'test-id',
						class: 'test-class',
						'data-test': 'test-value',
					},
					[]
				)
			);
		} );

		it( 'should skip ref attributes', () => {
			const element = createElementFromHTML(
				'<div id="test-id" ref="some-ref"></div>'
			);
			expect( toVdom( element ) ).toMatchVNode(
				h( 'div', { id: 'test-id' }, [] )
			);
		} );

		it( 'should warn about malformed directive names', () => {
			const console = global.console;
			const originalWarn = console.warn;
			console.warn = jest.fn();

			toVdom(
				createElementFromHTML( `<div data-wp-invalid[name]></div>` )
			);

			expect( console.warn ).toHaveBeenCalledWith(
				`Found malformed directive name: data-wp-invalid[name].`
			);

			console.warn = originalWarn;
		} );
	} );

	describe( 'Directive processing', () => {
		it( 'should process simple directives', () => {
			const element = createElementFromHTML(
				`<div data-wp-test-one data-wp-test-two="test value"></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-test-one': '',
						'data-wp-test-two': 'test value',
						__directives: {
							'test-one': [
								{
									namespace: null,
									value: '',
									suffix: null,
								},
							],
							'test-two': [
								{
									namespace: null,
									value: 'test value',
									suffix: null,
								},
							],
						},
					},
					[]
				)
			);
		} );

		it( 'should parse JSON values in directives', () => {
			const element = createElementFromHTML(
				`<div data-wp-test='{"key": "value"}'></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-test': '{"key": "value"}',
						__directives: {
							test: [
								{
									namespace: null,
									value: { key: 'value' },
									suffix: null,
								},
							],
						},
					},
					[]
				)
			);
		} );

		it( 'should handle malformed JSON and keep as string', () => {
			const element = createElementFromHTML(
				`<div data-wp-test="{malformed: json}"></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-test': '{malformed: json}',
						__directives: {
							test: [
								{
									namespace: null,
									value: '{malformed: json}',
									suffix: null,
								},
							],
						},
					},
					[]
				)
			);
		} );

		it( 'should process directive suffixes', () => {
			const element = createElementFromHTML(
				`<div data-wp-test--one="test value 1" data-wp-test--two="test value 2"></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-test--one': 'test value 1',
						'data-wp-test--two': 'test value 2',
						__directives: {
							test: [
								{
									namespace: null,
									value: 'test value 1',
									suffix: 'one',
								},
								{
									namespace: null,
									value: 'test value 2',
									suffix: 'two',
								},
							],
						},
					},
					[]
				)
			);
		} );

		it( 'should preserve values that JSON would parse but are not objects', () => {
			const element = createElementFromHTML(
				`<div data-wp-test--one='true' data-wp-test--two='"test value"'></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-test--one': 'true',
						'data-wp-test--two': '"test value"',
						__directives: {
							test: [
								{
									namespace: null,
									value: 'true',
									suffix: 'one',
								},
								{
									namespace: null,
									value: '"test value"',
									suffix: 'two',
								},
							],
						},
					},
					[]
				)
			);
		} );

		it( 'should handle directives in template elements', () => {
			const template = createElementFromHTML(
				`<template data-wp-test="test value"><div></div></template>`
			);
			expect( toVdom( template ) ).toMatchVNode(
				h(
					'template' as any,
					{
						'data-wp-test': 'test value',
						__directives: {
							test: [
								{
									namespace: null,
									value: 'test value',
									suffix: null,
								},
							],
						},
						content: [ h( 'div' as any, null, [] ) ],
					},
					[]
				)
			);
		} );

		it( 'should handle directives inside template elements', () => {
			const template = createElementFromHTML(
				`<template><div data-wp-test="test value"></div></template>`
			);
			expect( toVdom( template ) ).toMatchVNode(
				h(
					'template' as any,
					{
						content: [
							h(
								'div' as any,
								{
									'data-wp-test': 'test value',
									__directives: {
										test: [
											{
												namespace: null,
												value: 'test value',
												suffix: null,
											},
										],
									},
								},
								[]
							),
						],
					},
					[]
				)
			);
		} );
	} );

	describe( 'Namespaces', () => {
		it( 'should process directives with a custom namespace', () => {
			const element = createElementFromHTML(
				`<div data-wp-test="my-namespace::test value"></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-test': 'my-namespace::test value',
						__directives: {
							test: [
								{
									namespace: 'my-namespace',
									value: 'test value',
									suffix: null,
								},
							],
						},
					},
					[]
				)
			);
		} );

		it( 'should parse JSON values with a custom namespace', () => {
			const element = createElementFromHTML(
				`<div data-wp-test='my-namespace::{"key": "value"}'></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-test': 'my-namespace::{"key": "value"}',
						__directives: {
							test: [
								{
									namespace: 'my-namespace',
									value: { key: 'value' },
									suffix: null,
								},
							],
						},
					},
					[]
				)
			);
		} );

		it( 'should use the default namespace provided in the same element', () => {
			const element = createElementFromHTML(
				`<div data-wp-interactive="my-namespace" data-wp-test="test value"></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-interactive': 'my-namespace',
						'data-wp-test': 'test value',
						__directives: {
							test: [
								{
									namespace: 'my-namespace',
									value: 'test value',
									suffix: null,
								},
							],
						},
					},
					[]
				)
			);
		} );

		it( 'should override the default namespace provided in a parent element', () => {
			const element = createElementFromHTML(
				`<div data-wp-interactive="parent-namespace"><div data-wp-interactive="my-namespace" data-wp-test="test value"></div></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-interactive': 'parent-namespace',
					},
					[
						h(
							'div' as any,
							{
								'data-wp-interactive': 'my-namespace',
								'data-wp-test': 'test value',
								__directives: {
									test: [
										{
											namespace: 'my-namespace',
											value: 'test value',
											suffix: null,
										},
									],
								},
							},
							[]
						),
					]
				)
			);
		} );

		it( 'should handle default namespaces provided in the a JSON object', () => {
			const element = createElementFromHTML(
				`<div data-wp-interactive='{ "namespace": "my-namespace" }' data-wp-test="test value"></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-interactive':
							'{ "namespace": "my-namespace" }',
						'data-wp-test': 'test value',
						__directives: {
							test: [
								{
									namespace: 'my-namespace',
									value: 'test value',
									suffix: null,
								},
							],
						},
					},
					[]
				)
			);
		} );

		it( 'should recover the parent default namespace after a closing element', () => {
			const element = createElementFromHTML(
				`<div data-wp-interactive="parent-namespace"><div data-wp-interactive="child-namespace"></div><div data-wp-test="test value"></div></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-interactive': 'parent-namespace',
					},
					[
						h(
							'div' as any,
							{
								'data-wp-interactive': 'child-namespace',
							},
							[]
						),
						h(
							'div' as any,
							{
								'data-wp-test': 'test value',
								__directives: {
									test: [
										{
											namespace: 'parent-namespace',
											value: 'test value',
											suffix: null,
										},
									],
								},
							},
							[]
						),
					]
				)
			);
		} );

		it( 'should reset the default namespace after that last closing element', () => {
			const element = createElementFromHTML(
				`<div><div data-wp-interactive="my-namespace"></div><div data-wp-test="test value"></div></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h( 'div' as any, null, [
					h(
						'div' as any,
						{
							'data-wp-interactive': 'my-namespace',
						},
						[]
					),
					h(
						'div' as any,
						{
							'data-wp-test': 'test value',
							__directives: {
								test: [
									{
										namespace: null,
										value: 'test value',
										suffix: null,
									},
								],
							},
						},
						[]
					),
				] )
			);
		} );

		it( 'should override the default namespace with a custom one in the same element', () => {
			const element = createElementFromHTML(
				`<div data-wp-interactive="my-namespace" data-wp-test="custom-namespace::test value"></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-interactive': 'my-namespace',
						'data-wp-test': 'custom-namespace::test value',
						__directives: {
							test: [
								{
									namespace: 'custom-namespace',
									value: 'test value',
									suffix: null,
								},
							],
						},
					},
					[]
				)
			);
		} );

		it( 'should override the default namespace with a custom one in a child element', () => {
			const element = createElementFromHTML(
				`<div data-wp-interactive="my-namespace"><div data-wp-test="custom-namespace::test value"></div></div>`
			);
			expect( toVdom( element ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-interactive': 'my-namespace',
					},
					[
						h(
							'div' as any,
							{
								'data-wp-test': 'custom-namespace::test value',
								__directives: {
									test: [
										{
											namespace: 'custom-namespace',
											value: 'test value',
											suffix: null,
										},
									],
								},
							},
							[]
						),
					]
				)
			);
		} );

		it( 'should pass down namespaces defined in template elements', () => {
			const template = createElementFromHTML(
				`<template data-wp-interactive="my-namespace"><div data-wp-test="test value"></div></template>`
			);
			expect( toVdom( template ) ).toMatchVNode(
				h(
					'template' as any,
					{
						'data-wp-interactive': 'my-namespace',
						content: [
							h(
								'div' as any,
								{
									'data-wp-test': 'test value',
									__directives: {
										test: [
											{
												namespace: 'my-namespace',
												value: 'test value',
												suffix: null,
											},
										],
									},
								},
								[]
							),
						],
					},
					[]
				)
			);
		} );

		it( 'should pass down namespaces defined in template parents', () => {
			const template = createElementFromHTML(
				`<div data-wp-interactive="my-namespace"><template><div data-wp-test="test value"></div></template></div>`
			);
			expect( toVdom( template ) ).toMatchVNode(
				h(
					'div' as any,
					{
						'data-wp-interactive': 'my-namespace',
					},
					[
						h(
							'template' as any,
							{
								content: [
									h(
										'div' as any,
										{
											'data-wp-test': 'test value',
											__directives: {
												test: [
													{
														namespace:
															'my-namespace',
														value: 'test value',
														suffix: null,
													},
												],
											},
										},
										[]
									),
								],
							},
							[]
						),
					]
				)
			);
		} );
	} );

	describe( 'Hydrated islands', () => {
		it( 'should add a topmost island', () => {
			const element = createElementFromHTML( `
				<div data-wp-interactive="my-namespace"></div>
			` );
			toVdom( element );
			expect( hydratedIslands.has( element ) ).toBe( true );
		} );

		it( 'should add nested islands', () => {
			const outer = createElementFromHTML(
				`<div data-wp-interactive="outer"><div data-wp-interactive="inner"></div></div>`
			);
			const inner = outer.querySelector( '[data-wp-interactive="inner"' );
			toVdom( outer );
			expect( hydratedIslands.has( outer ) ).toBe( true );
			expect( hydratedIslands.has( inner! ) ).toBe( true );
		} );
	} );
} );
