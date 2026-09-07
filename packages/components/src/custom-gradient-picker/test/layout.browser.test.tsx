import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import CustomGradientPicker from '..';

afterEach( cleanup );

describe( 'CustomGradientPicker layout', () => {
	it.each( [ 'linear', 'radial' ] )(
		'preserves control sizing for %s gradients',
		( type ) => {
			render(
				<div style={ { width: 180 } }>
					<CustomGradientPicker
						value={ `${ type }-gradient(rgb(0,0,0) 0%,rgb(255,255,255) 100%)` }
						onChange={ () => {} }
					/>
				</div>
			);

			const typeControl = screen.getByRole( 'combobox', {
				name: 'Type',
			} );
			// These layout wrappers are presentational and have no accessible roles.
			const line = typeControl.closest(
				'.components-custom-gradient-picker__ui-line'
			) as HTMLElement;
			const wrappers = Array.from( line.children );

			expect( wrappers ).toHaveLength( 2 );
			expect(
				wrappers.map(
					( wrapper ) => getComputedStyle( wrapper ).flexGrow
				)
			).toEqual( [ '5', '5' ] );
			expect( wrappers[ 0 ].getBoundingClientRect().width ).toBe(
				wrappers[ 1 ].getBoundingClientRect().width
			);
		}
	);
} );
