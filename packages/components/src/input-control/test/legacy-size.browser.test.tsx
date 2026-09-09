import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import BaseInputControl from '../';
import InputControlPrefixWrapper from '../input-prefix-wrapper';

const InputControl = (
	props: React.ComponentProps< typeof BaseInputControl >
) => <BaseInputControl { ...props } data-testid="input" />;

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

function getComparedStyles( element: HTMLElement ) {
	const styles = window.getComputedStyle( element );
	return Object.fromEntries(
		comparedProperties.map( ( property ) => [
			property,
			styles[ property ],
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

		expect( getComparedStyles( legacyPrefixWrapper ) ).toEqual(
			getComparedStyles( defaultPrefixWrapper )
		);
		expect( getComparedStyles( legacyInput ) ).toEqual(
			getComparedStyles( defaultInput )
		);
	} );
} );
