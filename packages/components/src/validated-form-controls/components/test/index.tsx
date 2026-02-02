/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useRef, useLayoutEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ValidatedToggleControl } from '../';

describe( 'ValidatedToggleControl', () => {
	it( 'should validate correctly when checkValidity is called before useEffect runs', () => {
		// `useLayoutEffect` runs AFTER render but BEFORE `useEffect`.
		// This simulates code that runs before useEffect, such as validation
		// triggered immediately when a form card expands.
		let validityResult: boolean | null = null;
		function TestComponent() {
			const ref = useRef< HTMLInputElement >( null );
			useLayoutEffect( () => {
				// This runs BEFORE useEffect would run
				if ( ref.current ) {
					validityResult = ref.current.checkValidity();
				}
			}, [] );
			return (
				<ValidatedToggleControl
					ref={ ref }
					label="Required toggle"
					required
					checked={ false }
					onChange={ () => {} }
				/>
			);
		}
		render( <TestComponent /> );
		// `required` is set synchronously, so unchecked box fails validation.
		expect( validityResult ).toBe( false );
	} );
} );
