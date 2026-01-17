import { render } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Description } from '../index';

describe( 'EmptyState.Description', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLParagraphElement >();

		render( <Description ref={ ref }>Description text</Description> );

		expect( ref.current ).toBeInstanceOf( HTMLParagraphElement );
	} );
} );
