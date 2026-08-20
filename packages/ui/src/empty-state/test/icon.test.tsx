import { render } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Icon } from '../index';

describe( 'EmptyState.Icon', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render( <Icon ref={ ref } icon={ <svg /> } /> );

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );
} );
