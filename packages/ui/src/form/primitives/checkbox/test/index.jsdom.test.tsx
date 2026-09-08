import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { Checkbox } from '../index';

describe( 'Checkbox', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLSpanElement >();

		render( <Checkbox ref={ ref } /> );

		expect( ref.current ).toBeInstanceOf( HTMLSpanElement );
	} );

	it( 'renders checked when defaultChecked is true', () => {
		render( <Checkbox defaultChecked /> );

		expect( screen.getByRole( 'checkbox' ) ).toBeChecked();
	} );

	it( 'renders indeterminate state', () => {
		render( <Checkbox indeterminate defaultChecked /> );

		expect( screen.getByRole( 'checkbox' ) ).toBePartiallyChecked();
	} );

	it( 'does not expand the hit area by default', () => {
		render( <Checkbox aria-label="Option" /> );

		const checkbox = screen.getByRole( 'checkbox', { name: 'Option' } );
		expect( checkbox ).toBeVisible();
		expect( checkbox ).not.toHaveAttribute( 'hasExpandedHitArea' );
		expect( checkbox ).not.toHaveAttribute( 'data-expanded-hit-area' );
	} );

	it( 'does not set a hit-area DOM attribute when hasExpandedHitArea is true', () => {
		render( <Checkbox aria-label="Option" hasExpandedHitArea /> );

		const checkbox = screen.getByRole( 'checkbox', { name: 'Option' } );
		expect( checkbox ).toBeVisible();
		expect( checkbox ).not.toHaveAttribute( 'hasExpandedHitArea' );
		expect( checkbox ).not.toHaveAttribute( 'data-expanded-hit-area' );
	} );
} );
