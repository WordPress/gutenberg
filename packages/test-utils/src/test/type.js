/**
 * External dependencies
 */
import * as React from 'react';

/**
 * Internal dependencies
 */
import render from '../render';
import type from '../type';

describe( 'type', () => {
	it( 'should type on input', () => {
		const values = [];
		const { getByLabelText } = render(
			<input
				aria-label="input"
				onChange={ ( event ) => values.push( event.target.value ) }
			/>
		);
		const input = getByLabelText( 'input' );

		type( 'ab cd\b\bef', input );

		expect( values ).toEqual( [
			'a',
			'ab',
			'ab ',
			'ab c',
			'ab cd',
			'ab c',
			'ab ',
			'ab e',
			'ab ef',
		] );
	} );

	it( 'should not type on input if event.preventDefault() was called on key down', () => {
		const values = [];
		const { getByLabelText } = render(
			<input
				aria-label="input"
				onKeyDown={ ( event ) => {
					if ( event.key !== 'e' ) {
						event.preventDefault();
					}
				} }
				onChange={ ( event ) => values.push( event.target.value ) }
			/>
		);
		const input = getByLabelText( 'input' );

		type( 'ab cd\b\befe', input );

		expect( values ).toEqual( [ 'e', 'ee' ] );
	} );
} );
