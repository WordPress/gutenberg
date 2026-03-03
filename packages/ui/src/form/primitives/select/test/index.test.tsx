import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import * as Select from '../index';

describe( 'Select', () => {
	it( 'forwards ref', async () => {
		const user = userEvent.setup();
		const triggerRef = createRef< HTMLButtonElement >();
		const popupRef = createRef< HTMLDivElement >();
		const itemRef = createRef< HTMLDivElement >();

		render(
			<Select.Root>
				<Select.Trigger ref={ triggerRef } />
				<Select.Popup ref={ popupRef }>
					<Select.Item ref={ itemRef } value="Item 1" />
					<Select.Item value="Item 2" />
				</Select.Popup>
			</Select.Root>
		);

		// Test trigger ref before interaction
		expect( triggerRef.current ).toBeInstanceOf( HTMLButtonElement );

		// Click on the trigger to open the select dropdown
		await user.click( triggerRef.current! );

		// Now test that the popup and item refs are also available
		expect( popupRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( itemRef.current ).toBeInstanceOf( HTMLDivElement );
	} );
} );
