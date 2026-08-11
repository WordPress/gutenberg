import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import SelectControl from '..';
import { InputControlPrefixWrapper } from '../../input-control/input-prefix-wrapper';

const comparedProperties = [
	'height',
	'minHeight',
	'paddingTop',
	'paddingRight',
	'paddingBottom',
	'paddingLeft',
	'fontSize',
	'lineHeight',
	'borderRadius',
] as const;

function getComparedStyles( element: Element ) {
	const styles = getComputedStyle( element );
	return Object.fromEntries(
		comparedProperties.map( ( property ) => [
			property,
			styles[ property ],
		] )
	);
}

describe( 'SelectControl legacy size support', () => {
	it( 'treats __unstable-large the same as default', () => {
		const prefix = <InputControlPrefixWrapper>$</InputControlPrefixWrapper>;
		const options = [ { value: 'one', label: 'One' } ];

		render(
			<SelectControl label="Test" options={ options } prefix={ prefix } />
		);
		render(
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

		expect( getComparedStyles( legacyPrefixWrapper ) ).toEqual(
			getComparedStyles( defaultPrefixWrapper )
		);
		expect( getComparedStyles( legacySelect ) ).toEqual(
			getComparedStyles( defaultSelect )
		);
	} );
} );
