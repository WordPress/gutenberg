import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import BoxControlIcon from '../icon';

describe( 'BoxControlIcon', () => {
	it( 'renders a span when the element is undefined', () => {
		render( <BoxControlIcon as={ undefined } title="Selected sides" /> );

		expect( screen.getByTitle( 'Selected sides' ).tagName ).toBe( 'SPAN' );
	} );

	it( 'renders the requested element with consumer props', () => {
		render(
			<BoxControlIcon
				as="i"
				className="custom-icon"
				title="Selected sides"
			/>
		);

		const icon = screen.getByTitle( 'Selected sides' );
		expect( icon.tagName ).toBe( 'I' );
		expect( icon ).toHaveClass( 'custom-icon' );
	} );

	/* eslint-disable jest-dom/prefer-to-have-style -- These tests assert inline props, not computed styles. */
	it( 'scales the icon to the requested size', () => {
		render( <BoxControlIcon size={ 36 } title="Selected sides" /> );

		expect( screen.getByTitle( 'Selected sides' ).style.transform ).toBe(
			'scale(1.5)'
		);
	} );

	it( 'lets consumer styles replace the generated scale', () => {
		render(
			<BoxControlIcon
				size={ 36 }
				style={ { color: 'red' } }
				title="Selected sides"
			/>
		);

		const icon = screen.getByTitle( 'Selected sides' );
		expect( icon.style.color ).toBe( 'red' );
		expect( icon.style.transform ).toBe( '' );
	} );
	/* eslint-enable jest-dom/prefer-to-have-style */
} );
