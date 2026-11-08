import { describe, expect, it } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useState } from '@wordpress/element';
import NumberControl from '..';

function StatefulNumberControl() {
	const [ value, setValue ] = useState< string | undefined >( '5' );

	return <NumberControl value={ value } onChange={ setValue } />;
}

function dragInput( input: Element, pointerType: 'touch' | 'mouse' ) {
	const pointer = {
		pointerId: 1,
		pointerType,
		isPrimary: true,
		button: 0,
		buttons: 1,
		clientX: 50,
	};

	fireEvent.pointerDown( input, { ...pointer, clientY: 100 } );
	fireEvent.pointerMove( window, { ...pointer, clientY: 80 } );
	fireEvent.pointerMove( window, { ...pointer, clientY: 40 } );
	fireEvent.pointerUp( window, { ...pointer, clientY: 40, buttons: 0 } );
}

describe( 'NumberControl drag to change value', () => {
	it( 'does not change the value when dragged with touch input', async () => {
		const screen = await render( <StatefulNumberControl /> );
		const input = screen.getByRole( 'spinbutton' );

		dragInput( input.element(), 'touch' );

		await expect.element( input ).toHaveValue( 5 );
	} );

	it( 'changes the value when dragged with mouse input', async () => {
		const screen = await render( <StatefulNumberControl /> );
		const input = screen.getByRole( 'spinbutton' );

		dragInput( input.element(), 'mouse' );

		await expect.element( input ).toHaveValue( 55 );
	} );
} );
