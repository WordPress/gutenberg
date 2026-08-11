import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import BaseInputControl from '../';
import InputControlPrefixWrapper from '../input-prefix-wrapper';

const InputControl = ( props ) => (
	<BaseInputControl { ...props } data-testid="input" />
);

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
];

function getComparedStyles( element ) {
	const styles = window.getComputedStyle( element );
	return Object.fromEntries(
		comparedProperties.map( ( property ) => [
			property,
			styles[ property ],
		] )
	);
}

describe( 'InputControl legacy size support', () => {
	it( 'treats __unstable-large the same as default', () => {
		const prefix = <InputControlPrefixWrapper>$</InputControlPrefixWrapper>;

		render( <InputControl label="Test" prefix={ prefix } /> );
		render(
			<InputControl
				label="Test"
				prefix={ prefix }
				{ ...{ size: '__unstable-large' } }
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
