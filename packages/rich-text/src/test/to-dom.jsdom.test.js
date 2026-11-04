import { describe, expect, it } from 'vitest';
import '../store';
import { toDom, apply, applyValue } from '../to-dom';
import { createElement } from '../create-element';
import { create } from '../create';
import { registerFormatType } from '../register-format-type';
import { unregisterFormatType } from '../unregister-format-type';
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
} );

describe( 'apply', () => {
	spec.forEach( ( { description, record } ) => {
		it( `should set the same tree in an empty unfocused element: ${ description }`, () => {
			const current = document.createElement( 'div' );
			apply( { value: record, current, __unstableDomOnly: true } );
			expect( current.innerHTML ).toBe(
				toDom( { value: record } ).body.innerHTML
			);
		} );
	} );

	it( 'should set the same tree in an empty unfocused element for a non-editable format', () => {
		registerFormatType( 'test/math', {
			title: 'Math',
			tagName: 'math',
			className: null,
			contentEditable: false,
			edit() {},
		} );
		const value = create( { html: 'a <math><mi>x</mi></math>' } );
		const current = document.createElement( 'div' );
		apply( { value, current, __unstableDomOnly: true } );
		const expected = toDom( { value } ).body.innerHTML;
		unregisterFormatType( 'test/math' );

		expect( current.innerHTML ).toBe( expected );
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
