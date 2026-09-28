import { beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { screen } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import PresetInputControl from '../index';

const defaultProps = {
	ariaLabel: 'Spacing control',
	onChange: vi.fn(),
	presetType: 'spacing',
};

beforeEach( () => {
	vi.clearAllMocks();
} );

describe( 'PresetInputControl browser interactions', () => {
	it( 'clears value with undefined when input is fully erased via backspace', async () => {
		const user = userEvent.setup();
		await render(
			createElement( PresetInputControl, {
				...defaultProps,
				presets: [
					{ name: 'None', slug: '0', size: '0' },
					{ name: 'Small', slug: 'small', size: '10px' },
				],
				value: '60px',
				disableCustomValues: false,
			} )
		);

		const input = screen.getByRole( 'spinbutton' );

		await user.click( input );
		await user.keyboard( '{End}{Backspace}{Backspace}' );

		expect( defaultProps.onChange ).toHaveBeenLastCalledWith( undefined );
		expect( defaultProps.onChange ).not.toHaveBeenCalledWith( '' );
	} );

	it( 'can interact with select dropdown options', async () => {
		const user = userEvent.setup();
		const manyPresets = Array.from( { length: 12 }, ( _, index ) => ( {
			name: `Preset ${ index + 1 }`,
			slug: `preset-${ index + 1 }`,
			size: `${ ( index + 1 ) * 5 }px`,
		} ) );

		await render(
			createElement( PresetInputControl, {
				...defaultProps,
				presets: manyPresets,
			} )
		);

		await user.click( screen.getByRole( 'combobox' ) );

		await expect
			.element( page.getByRole( 'combobox', { expanded: true } ) )
			.toBeVisible();
	} );
} );
