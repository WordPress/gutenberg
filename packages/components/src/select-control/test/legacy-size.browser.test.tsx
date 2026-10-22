import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import SelectControl from '..';
import { InputControlPrefixWrapper } from '../../input-control/input-prefix-wrapper';

function getComputedStyles( element: Element ) {
	const styles = getComputedStyle( element );
	return Object.fromEntries(
		Array.from( styles ).map( ( property ) => [
			property,
			styles.getPropertyValue( property ),
		] )
	);
}

describe( 'SelectControl legacy size support', () => {
	it( 'treats __unstable-large the same as default', async () => {
		const prefix = <InputControlPrefixWrapper>$</InputControlPrefixWrapper>;
		const options = [ { value: 'one', label: 'One' } ];

		await render(
			<SelectControl label="Test" options={ options } prefix={ prefix } />
		);
		await render(
			<SelectControl
				label="Test"
				options={ options }
				prefix={ prefix }
				// @ts-expect-error testing legacy runtime support for removed size type
				size="__unstable-large"
			/>
		);

		const [ defaultPrefixWrapper, legacyPrefixWrapper ] =
			screen.getAllByText( '$' );
		const [ defaultSelect, legacySelect ] =
			screen.getAllByRole( 'combobox' );

		expect( getComputedStyles( legacyPrefixWrapper ) ).toEqual(
			getComputedStyles( defaultPrefixWrapper )
		);
		expect( getComputedStyles( legacySelect ) ).toEqual(
			getComputedStyles( defaultSelect )
		);
	} );
} );
