/**
 * External dependencies
 */

import { JSDOM } from 'jsdom';

/**
 * Internal dependencies
 */

import { toDom, applyValue } from '../to-dom';
import { createElement } from '../create-element';
import { spec } from './helpers';

const { window } = new JSDOM();
const { document } = window;

describe( 'recordToDom', () => {
	beforeAll( () => {
		// Initialize the rich-text store.
		require( '../store' );
	} );

	spec.forEach( ( {
		description,
		multilineTag,
		record,
		startPath,
		endPath,
	} ) => {
		it( description, () => {
			const { body, selection } = toDom( {
				value: record,
				multilineTag,
			} );
			expect( body ).toMatchSnapshot();
			expect( selection ).toEqual( { startPath, endPath } );
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
	];

	cases.forEach( ( { current, future, description, movedCount } ) => {
		it( description, () => {
			const body = createElement( document, current ).cloneNode( true );
			const futureBody = createElement( document, future ).cloneNode( true );
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
