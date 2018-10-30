/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	getSerializeCapableElement,
	concat,
	toHTML,
	fromDOM,
} from '../children';

describe( 'getSerializeCapableElement', () => {
	it( 'returns a serialize capable element', () => {
		const blockNode = [
			'This ',
			{
				type: 'strong',
				props: {
					class: 'is-extra-strong',
					children: [ 'is' ],
				},
			},
			' a test',
		];

		const element = getSerializeCapableElement( blockNode );

		// Intentionally avoid introspecting the shape of the generated element
		// since all that is cared about is that it can be serialized.
		const html = renderToString( element );

		expect( html ).toBe( 'This <strong class="is-extra-strong">is</strong> a test' );
	} );
} );

describe( 'concat', () => {
	it( 'should combine two or more sets of block nodes', () => {
		const result = concat(
			{
				type: 'strong',
				props: {
					children: [ 'Hello' ],
				},
			},
			' ',
			{
				type: 'em',
				props: {
					children: [ 'world' ],
				},
			},
		);

		expect( result ).toEqual( [
			{
				type: 'strong',
				props: {
					children: [ 'Hello' ],
				},
			},
			' ',
			{
				type: 'em',
				props: {
					children: [ 'world' ],
				},
			},
		] );
	} );

	it( 'should merge adjacent strings', () => {
		const result = concat(
			'Hello',
			' ',
			{
				type: 'strong',
				props: {
					children: [ 'World' ],
				},
			},
		);

		expect( result ).toEqual( [
			'Hello ',
			{
				type: 'strong',
				props: {
					children: [ 'World' ],
				},
			},
		] );
	} );
} );

describe( 'toHTML', () => {
	it( 'should convert a children array of block nodes to its equivalent html string', () => {
		const children = [
			'This is a ',
			{
				type: 'strong',
				props: {
					children: [ 'test' ],
				},
			},
			'!',
		];

		const html = toHTML( children );

		expect( html ).toBe( 'This is a <strong>test</strong>!' );
	} );
} );

describe( 'fromDOM', () => {
	it( 'should return an equivalent block children', () => {
		const node = document.createElement( 'div' );
		node.innerHTML = 'This <strong class="is-extra-strong">is</strong> a test';

		const blockNode = fromDOM( node.childNodes );

		expect( blockNode ).toEqual( [
			'This ',
			{
				type: 'strong',
				props: {
					class: 'is-extra-strong',
					children: [ 'is' ],
				},
			},
			' a test',
		] );
	} );
} );
