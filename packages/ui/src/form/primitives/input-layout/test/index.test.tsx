import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import { InputLayout } from '../index';
import { InputLayoutSlot } from '../slot';

describe( 'InputLayout', () => {
	it( 'forwards ref', () => {
		const layoutRef = createRef< HTMLDivElement >();
		const slotRef = createRef< HTMLDivElement >();

		render(
			<InputLayout
				ref={ layoutRef }
				prefix={
					<InputLayoutSlot ref={ slotRef }>Prefix</InputLayoutSlot>
				}
			/>
		);

		expect( layoutRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( slotRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	// Testing the DOM contract that CSS selectors depend on.
	it( 'wraps prefix and suffix with data-slot-type attributes', () => {
		render(
			<InputLayout
				prefix={ <InputLayout.Slot>Prefix</InputLayout.Slot> }
				suffix={ <InputLayout.Slot>Suffix</InputLayout.Slot> }
			/>
		);

		/* eslint-disable testing-library/no-node-access */
		const prefix = screen
			.getByText( 'Prefix' )
			.closest( '[data-slot-type]' );
		expect( prefix ).toHaveAttribute( 'data-slot-type', 'prefix' );

		const suffix = screen
			.getByText( 'Suffix' )
			.closest( '[data-slot-type]' );
		expect( suffix ).toHaveAttribute( 'data-slot-type', 'suffix' );
		/* eslint-enable testing-library/no-node-access */
	} );

	it( 'does not render slot wrappers when prefix/suffix are empty', () => {
		render( <InputLayout data-testid="layout" /> );

		const layout = screen.getByTestId( 'layout' );
		/* eslint-disable testing-library/no-node-access */
		expect(
			layout.querySelector( '[data-slot-type]' )
		).not.toBeInTheDocument();
		/* eslint-enable testing-library/no-node-access */
	} );
} );
