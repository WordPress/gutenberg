import { render } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Icon } from '../index';

describe( 'Icon', () => {
	it( 'forwards ref', () => {
		const ref = createRef< SVGSVGElement >();

		render( <Icon ref={ ref } icon={ <svg /> } /> );

		expect( ref.current ).toBeInstanceOf( SVGSVGElement );
	} );
} );
