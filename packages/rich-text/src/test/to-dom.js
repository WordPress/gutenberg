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
			current: 'test1 <span data-current-attribute1="current1" data-current-attribute2="current2">test2</span> <span>test3</span>',
			future: 'test1 test2 <span>test3</span>',
			movedCount: 1,
			description: 'should remove attributes',
		},
		{
			current: 'test1 <span>test2</span> <span>test3</span>',
			future: 'test1 test2 <span data-future-attribute1="future1" data-future-attribute2="future2">test3</span>',
			movedCount: 1,
			description: 'should add attributes',
		},
		{
			current: 'test1 <span data-common-attribute1="current" data-common-attribute2="common">test2</span> <span>test3</span>',
			future: 'test1 test2 <span data-common-attribute1="future" data-common-attribute2="common">test3</span>',
			movedCount: 1,
			description: 'should update attributes',
		},
		{
			current: 'test1 <span data-current-attribute1="current1" data-current-attribute2="current2" data-common-attribute1="current" data-common-attribute2="common">test2</span> <span>test3</span>',
			future: 'test1 test2 <span data-common-attribute2="common" data-common-attribute1="future" data-future-attribute2="future2" data-future-attribute1="future1">test3</span>',
			movedCount: 1,
			description: 'should apply attributes',
			expected: 'test1 test2 <span data-common-attribute1="future" data-common-attribute2="common" data-future-attribute2="future2" data-future-attribute1="future1">test3</span>',
		},
	];

	cases.forEach( ( { current, future, description, movedCount, expected } ) => {
		it( description, () => {
			const body = createElement( document, current ).cloneNode( true );
			const futureBody = createElement( document, future ).cloneNode( true );
			const childNodes = Array.from( futureBody.childNodes );
			applyValue( futureBody, body );
			const count = childNodes.reduce( ( acc, { parentNode } ) => {
				return parentNode === body ? acc + 1 : acc;
			}, 0 );
			expect( undefined === expected ? future : expected ).toEqual( body.innerHTML );
			expect( count ).toEqual( movedCount );
		} );
	} );
} );
