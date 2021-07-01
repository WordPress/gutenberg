/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useLatestRef } from '..';

function getInput() {
	return screen.getByRole( 'textbox' );
}

describe( 'useLatestRef', () => {
	function Example( { value, onChange } ) {
		const ref = useLatestRef( value );

		const handleChange = useCallback( () => {
			onChange( ref.current );
		}, [ ref, onChange ] );

		return <input value={ ref.current } onChange={ handleChange } />;
	}

	it( 'should maintain the ref when the prop value changes', () => {
		const { rerender } = render( <Example value="A" /> );

		rerender( <Example value="B" /> );

		expect( getInput().value ).toEqual( 'A' );
	} );

	it( 'should keep a handle on the value', () => {
		render( <Example value="A" /> );

		expect( getInput().value ).toEqual( 'A' );
	} );
} );
