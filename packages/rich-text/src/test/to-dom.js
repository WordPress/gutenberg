/**
 * Internal dependencies
 */
import { toDom, applyValue } from '../to-dom';
import { createElement } from '../create-element';
import { spec } from './helpers';
import { OBJECT_REPLACEMENT_CHARACTER } from '../special-characters';
import { registerFormatType } from '../register-format-type';
import { unregisterFormatType } from '../unregister-format-type';

describe( 'recordToDom', () => {
	beforeAll( () => {
		// Initialize the rich-text store.
		require( '../store' );
	} );

	spec.forEach( ( { description, record, startPath, endPath } ) => {
		// eslint-disable-next-line jest/valid-title
		it( description, () => {
			const { body, selection } = toDom( {
				value: record,
			} );
			expect( body ).toMatchSnapshot();
			expect( selection ).toEqual( { startPath, endPath } );
		} );
	} );

	it( 'should use the namespace specfied by the format', () => {
		const formatName = 'my-plugin/nom';
		const namespace = 'http://www.w3.org/1998/Math/MathML';

		registerFormatType( formatName, {
			namespace,
			title: 'Math',
			tagName: 'math',
			className: 'nom-math',
			contentEditable: false,
			edit() {},
		} );

		const { body } = toDom( {
			value: {
				formats: [ , ],
				replacements: [
					{
						type: 'my-plugin/nom',
						tagName: 'math',
						attributes: {},
						unregisteredAttributes: {},
						innerHTML: '0',
					},
				],
				text: OBJECT_REPLACEMENT_CHARACTER,
			},
		} );

		unregisterFormatType( formatName );

		const subject = body.firstElementChild;
		expect( subject.outerHTML ).toBe(
			`<math class="nom-math" contenteditable="false">0</math>`
		);
		expect( subject.namespaceURI ).toBe( namespace );
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
	];

	cases.forEach( ( { current, future, description, movedCount } ) => {
		// eslint-disable-next-line jest/valid-title
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
