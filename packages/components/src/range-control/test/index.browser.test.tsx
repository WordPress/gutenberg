import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import RangeControl from '..';

const getHeight = ( element: Element ) =>
	element.getBoundingClientRect().height;

// The root row has no role of its own, so find it from the slider.
const getRoot = () =>
	// eslint-disable-next-line testing-library/no-node-access
	screen.getByRole( 'slider' ).closest( '.components-range-control__root' )!;

describe( 'RangeControl', () => {
	describe( 'size', () => {
		it( 'should render at 40px by default', async () => {
			await render( <RangeControl label="Opacity" /> );

			expect( getHeight( getRoot() ) ).toBe( 40 );
			expect( getHeight( screen.getByRole( 'spinbutton' ) ) ).toBe( 40 );
		} );

		it( 'should render at 32px when `size` is compact', async () => {
			await render( <RangeControl label="Opacity" size="compact" /> );

			expect( getHeight( getRoot() ) ).toBe( 32 );
			expect( getHeight( screen.getByRole( 'spinbutton' ) ) ).toBe( 32 );
		} );

		it( 'should keep the compact height without the input field', async () => {
			await render(
				<RangeControl
					label="Opacity"
					size="compact"
					withInputField={ false }
				/>
			);

			expect( getHeight( getRoot() ) ).toBe( 32 );
		} );
	} );
} );
