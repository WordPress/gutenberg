/**
 * External dependencies
 */
import { createRef } from 'react';
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { ButtonIcon } from '../icon';

describe( 'Button.Icon', () => {
	it( 'forwards ref', () => {
		const ref = createRef< SVGSVGElement >();

		render( <ButtonIcon ref={ ref } icon={ <svg /> } /> );

		expect( ref.current ).toBeInstanceOf( SVGSVGElement );
	} );
} );
