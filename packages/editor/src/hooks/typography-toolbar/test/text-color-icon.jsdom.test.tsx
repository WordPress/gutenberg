import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import TextColorIcon from '../text-color-icon';

describe( 'TextColorIcon', () => {
	it( 'draws the colour as a line under the letter, not on it', () => {
		render( <TextColorIcon color="#b4522d" /> );

		expect( screen.getByTestId( 'typography-color-bar' ) ).toHaveStyle( {
			background: '#b4522d',
		} );
	} );

	it( 'shows no line at all when there is no colour to show', () => {
		render( <TextColorIcon /> );

		expect( screen.getByTestId( 'typography-color-bar' ) ).toHaveStyle( {
			background: 'transparent',
		} );
	} );
} );
