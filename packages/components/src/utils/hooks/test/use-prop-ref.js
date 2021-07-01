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
import { usePropRef } from '..';

function getInput() {
	return screen.getByRole( 'textbox' );
}

describe( 'usePropRef', () => {
	function Example( { value, onChange } ) {
		const ref = usePropRef( value );

		const handleChange = useCallback( () => {
			onChange( ref.current );
		}, [ ref, onChange ] );

		return <input value={ ref.current } onChange={ handleChange } />;
	}

	it( 'should maintain the ref when the prop value changes', () => {
		const { rerender } = render( <Example value="A" /> );

		expect( getInput().value ).toEqual( 'A' );

		rerender( <Example value="B" /> );

		expect( getInput().value ).toEqual( 'A' );
	} );
} );
