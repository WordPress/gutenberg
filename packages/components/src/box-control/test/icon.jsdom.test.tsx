import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import BoxControlIcon from '../icon';

describe( 'BoxControlIcon', () => {
	/* eslint-disable jest-dom/prefer-to-have-style -- These tests assert inline props, not computed styles. */
	it( 'renders the default element with the generated scale', () => {
		render( <BoxControlIcon size={ 36 } title="Selected sides" /> );

		const icon = screen.getByTitle( 'Selected sides' );
		expect( icon.tagName ).toBe( 'SPAN' );
		expect( icon.style.transform ).toBe( 'scale(1.5)' );
	} );

	it( 'forwards consumer props to the requested element', () => {
		render(
			<BoxControlIcon
				as="i"
				className="custom-icon"
				size={ 36 }
				style={ { color: 'red' } }
				title="Selected sides"
			/>
		);

		const icon = screen.getByTitle( 'Selected sides' );
		expect( icon.tagName ).toBe( 'I' );
		expect( icon ).toHaveClass( 'custom-icon' );
		expect( icon.style.color ).toBe( 'red' );
		expect( icon.style.transform ).toBe( '' );
	} );
	/* eslint-enable jest-dom/prefer-to-have-style */
} );
