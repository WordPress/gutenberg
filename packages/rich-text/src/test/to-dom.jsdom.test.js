import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import '../store';
import { toDom, applyValue } from '../to-dom';
import { create } from '../create';
import { createElement } from '../create-element';
import { registerFormatType } from '../register-format-type';
import { unregisterFormatType } from '../unregister-format-type';
import { OBJECT_REPLACEMENT_CHARACTER, ZWNBSP } from '../special-characters';
import { spec } from './helpers';

describe( 'recordToDom', () => {
	spec.forEach( ( { description, record, startPath, endPath } ) => {
		it( description, () => {
			const { body, selection } = toDom( {
				value: record,
			} );
			expect( body ).toMatchSnapshot();
			expect( selection ).toEqual( { startPath, endPath } );
		} );
	} );

	describe( 'non editable format', () => {
		const formatName = 'my-plugin/non-editable';
		const replacement = {
			type: formatName,
			attributes: { 'data-fn': 'x' },
			innerHTML: '<a href="#x">1</a>',
		};
		const wrapper =
			'<span contenteditable="false" data-rich-text-bogus="true"><sup data-fn="x" class="non-editable"><a href="#x">1</a></sup></span>';

		function createValue( text, start ) {
			const value = {
				text,
				formats: Array( text.length ),
				replacements: Array( text.length ),
				start,
				end: start,
			};
			value.replacements[ text.indexOf( OBJECT_REPLACEMENT_CHARACTER ) ] =
				replacement;
			return value;
		}

		function getNode( body, path ) {
			return path
				.slice( 0, -1 )
				.reduce( ( node, index ) => node.childNodes[ index ], body );
		}

		beforeAll( () => {
			registerFormatType( formatName, {
				title: 'Non Editable',
				tagName: 'sup',
				className: 'non-editable',
				contentEditable: false,
				edit() {},
			} );
		} );

		afterAll( () => {
			unregisterFormatType( formatName );
		} );

		it( 'should place the caret after the wrapper, before the padding, at the end of the field', () => {
			const value = createValue(
				`ab${ OBJECT_REPLACEMENT_CHARACTER }`,
				3
			);
			const { body, selection } = toDom( { value } );

			expect( body.innerHTML ).toBe( `ab${ wrapper }${ ZWNBSP }` );
			// The caret is in the text node after the wrapper, before the
			// padding, where the browser can act on the object.
			expect( selection ).toEqual( {
				startPath: [ 2, 0 ],
				endPath: [ 2, 0 ],
			} );
			const caretNode = getNode( body, selection.startPath );
			expect( caretNode.parentNode ).toBe( body );
			expect( caretNode.previousSibling.nodeName ).toBe( 'SPAN' );

			// The position reads back as the same offset.
			const range = document.createRange();
			range.setStart( caretNode, 0 );
			range.setEnd( caretNode, 0 );
			const record = create( {
				element: body,
				range,
				__unstableIsEditableTree: true,
			} );
			expect( record.text ).toBe( value.text );
			expect( record.start ).toBe( 3 );
			expect( record.end ).toBe( 3 );
		} );

		it( 'should place the caret after the wrapper in the middle of the field', () => {
			const value = createValue(
				`ab${ OBJECT_REPLACEMENT_CHARACTER } tail`,
				3
			);
			const { body, selection } = toDom( { value } );

			expect( body.innerHTML ).toBe( `ab${ wrapper } tail` );
			expect( selection ).toEqual( {
				startPath: [ 2, 0 ],
				endPath: [ 2, 0 ],
			} );
			expect( getNode( body, selection.startPath ).nodeValue ).toBe(
				' tail'
			);
		} );

		it( 'should not wrap or pad in the non editable tree', () => {
			const value = createValue(
				`ab${ OBJECT_REPLACEMENT_CHARACTER }`,
				3
			);
			const { body } = toDom( { value, isEditableTree: false } );

			expect( body.innerHTML ).toBe(
				'ab<sup data-fn="x" class="non-editable"><a href="#x">1</a></sup>'
			);
		} );
	} );
} );

describe( 'applyValue', () => {
	const cases = [
		{
			current: 'test',
			future: '',
			movedCount: 0,
			description: 'should remove nodes',
		},
		{
			current: '',
			future: 'test',
			movedCount: 1,
			description: 'should add nodes',
		},
		{
			current: 'test',
			future: 'test',
			movedCount: 0,
			description: 'should not modify',
		},
		{
			current: '<span data-1="">b</span>',
			future: '<span>b</span>',
			movedCount: 0,
			description: 'should remove attribute',
		},
		{
			current: '<span data-1="" data-2="">b</span>',
			future: '<span>b</span>',
			movedCount: 0,
			description: 'should remove attributes',
		},
		{
			current: '<span>a</span>',
			future: '<span data-1="">c</span>',
			movedCount: 0,
			description: 'should add attribute',
		},
		{
			current: '<span>a</span>',
			future: '<span data-1="" data-2="">c</span>',
			movedCount: 0,
			description: 'should add attributes',
		},
		{
			current: '<span data-1="i">a</span>',
			future: '<span data-1="ii">a</span>',
			movedCount: 0,
			description: 'should update attribute',
		},
		{
			current: '<span data-1="i" data-2="ii">a</span>',
			future: '<span data-1="ii" data-2="i">a</span>',
			movedCount: 0,
			description: 'should update attributes',
		},
		{
			current: '<math><mi>x</mi></math>',
			future: '<math><mi>y</mi></math>',
			movedCount: 0,
			description: 'should update MathML content',
		},
		{
			current: '<math><mfrac><mi>a</mi><mi>b</mi></mfrac></math>',
			future: '<math><mfrac><mi>x</mi><mi>y</mi></mfrac></math>',
			movedCount: 0,
			description: 'should update MathML fraction',
		},
		{
			current: '<math><mtext><strong>bold</strong></mtext></math>',
			future: '<math><mtext><em>italic</em></mtext></math>',
			movedCount: 0,
			description: 'should update HTML elements within MathML mtext',
		},
	];

	cases.forEach( ( { current, future, description, movedCount } ) => {
		it( description, () => {
			const body = createElement( document, current ).cloneNode( true );
			const futureBody = createElement( document, future ).cloneNode(
				true
			);
			const childNodes = Array.from( futureBody.childNodes );
			applyValue( futureBody, body );
			const count = childNodes.reduce( ( acc, { parentNode } ) => {
				return parentNode === body ? acc + 1 : acc;
			}, 0 );
			expect( body.innerHTML ).toEqual( future );
			expect( count ).toEqual( movedCount );
		} );
	} );
} );
