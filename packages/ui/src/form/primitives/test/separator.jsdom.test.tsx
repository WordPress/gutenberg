import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import * as Autocomplete from '../autocomplete';
import * as Combobox from '../combobox';
import * as Select from '../select';

describe.each( [
	[ 'Autocomplete', Autocomplete.Separator ],
	[ 'Combobox', Combobox.Separator ],
	[ 'Select', Select.Separator ],
] )( '%s.Separator', ( _name, Separator ) => {
	it( 'renders a presentational divider and forwards its class and ref', () => {
		const ref = createRef< HTMLDivElement >();
		render( <Separator ref={ ref } className="custom-separator" /> );
		const separator = screen.getByRole( 'presentation' );

		expect( separator ).toHaveAttribute( 'role', 'presentation' );
		expect( separator ).toHaveClass( 'custom-separator' );
		expect( ref.current ).toBe( separator );
	} );
} );
