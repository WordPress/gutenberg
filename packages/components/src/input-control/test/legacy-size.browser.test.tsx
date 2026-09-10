import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import BaseInputControl from '../';
import InputControlPrefixWrapper from '../input-prefix-wrapper';

const InputControl = (
	props: React.ComponentProps< typeof BaseInputControl >
) => <BaseInputControl { ...props } data-testid="input" />;

function getComputedStyles( element: Element ) {
	const styles = getComputedStyle( element );
	return Object.fromEntries(
		Array.from( styles ).map( ( property ) => [
			property,
			styles.getPropertyValue( property ),
		] )
	);
}

describe( 'InputControl legacy size support', () => {
	it( 'treats __unstable-large the same as default', async () => {
		const prefix = <InputControlPrefixWrapper>$</InputControlPrefixWrapper>;

		await render( <InputControl label="Test" prefix={ prefix } /> );
		await render(
			<InputControl
				label="Test"
				prefix={ prefix }
				{ ...( {
					size: '__unstable-large',
				} as unknown as React.ComponentProps< typeof InputControl > ) }
			/>
		);

		const [ defaultPrefixWrapper, legacyPrefixWrapper ] =
			screen.getAllByText( '$' );
		const [ defaultInput, legacyInput ] = screen.getAllByTestId( 'input' );

		expect( getComputedStyles( legacyPrefixWrapper ) ).toEqual(
			getComputedStyles( defaultPrefixWrapper )
		);
		expect( getComputedStyles( legacyInput ) ).toEqual(
			getComputedStyles( defaultInput )
		);
	} );
} );
