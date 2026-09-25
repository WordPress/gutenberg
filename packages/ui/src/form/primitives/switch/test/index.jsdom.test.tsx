import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Switch } from '../index';

describe( 'Switch', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLSpanElement >();

		render( <Switch ref={ ref } /> );

		expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
	} );

	it( 'renders checked when defaultChecked is true', () => {
		render( <Switch defaultChecked /> );

		expect( screen.getByRole( 'switch' ) ).toBeChecked();
	} );
} );
