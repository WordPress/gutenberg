import { render } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Input } from '../index';

describe( 'Input', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLInputElement >();

		render( <Input ref={ ref } /> );

		expect( ref.current ).toBeInstanceOf( HTMLInputElement );
	} );
} );
