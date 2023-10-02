/**
 * Internal dependencies
 */
import { space } from '../space';

describe( 'space', () => {
	it.each`
		input            | output
		${ 1 }           | ${ 'calc(4px * 1)' }
		${ '1' }         | ${ 'calc(4px * 1)' }
		${ '-1px' }      | ${ '-1px' }
		${ '1em' }       | ${ '1em' }
		${ '1notaunit' } | ${ '1notaunit' }
		${ 'auto' }      | ${ 'auto' }
	`( 'should return $output when given $input', ( { input, output } ) => {
		expect( space( input ) ).toEqual( output );
	} );
} );
