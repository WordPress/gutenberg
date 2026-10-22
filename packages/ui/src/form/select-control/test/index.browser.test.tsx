import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
import { SelectControl } from '../index';

describe( 'SelectControl', () => {
	it( 'preserves control defaults and lets trigger slot props override them', async () => {
		await render(
			<>
				<SelectControl label="Default" />
				<SelectControl
					label="Inherited"
					size="compact"
					placeholder="Choose a country"
					trigger={ <SelectControl.Trigger /> }
				/>
				<SelectControl
					label="Overridden"
					size="compact"
					placeholder="Choose a country"
					trigger={
						<SelectControl.Trigger
							size="default"
							placeholder="Choose a region"
						/>
					}
				/>
			</>
		);

		const defaultTrigger = screen.getByRole( 'combobox', {
			name: 'Default',
		} );
		const inheritedTrigger = screen.getByRole( 'combobox', {
			name: 'Inherited',
		} );
		const overriddenTrigger = screen.getByRole( 'combobox', {
			name: 'Overridden',
		} );

		expect( defaultTrigger ).toHaveTextContent( 'Select' );
		expect( inheritedTrigger ).toHaveTextContent( 'Choose a country' );
		expect( overriddenTrigger ).toHaveTextContent( 'Choose a region' );
		expect( inheritedTrigger.getBoundingClientRect().height ).toBeLessThan(
			defaultTrigger.getBoundingClientRect().height
		);
		expect( overriddenTrigger.getBoundingClientRect().height ).toBe(
			defaultTrigger.getBoundingClientRect().height
		);
	} );
} );
