import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { describe, expect, it } from 'vitest';
import { Radio } from '../../radio';
import { RadioGroup } from '../index';

declare const wpVitest: {
	mockPointerEvent: () => void;
};

wpVitest.mockPointerEvent();

describe( 'RadioGroup', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render(
			<RadioGroup ref={ ref } aria-label="Fruit">
				<Radio value="apple" aria-label="Apple" />
			</RadioGroup>
		);

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'selects a single value in uncontrolled mode', async () => {
		const user = userEvent.setup();

		render(
			<RadioGroup aria-label="Fruit">
				<Radio value="apple" aria-label="Apple" />
				<Radio value="orange" aria-label="Orange" />
			</RadioGroup>
		);

		const apple = screen.getByRole( 'radio', { name: 'Apple' } );
		const orange = screen.getByRole( 'radio', { name: 'Orange' } );

		expect( apple ).not.toBeChecked();
		expect( orange ).not.toBeChecked();

		await user.click( apple );

		expect( apple ).toBeChecked();
		expect( orange ).not.toBeChecked();
	} );

	it( 'replaces the previous selection when another option is chosen', async () => {
		const user = userEvent.setup();

		render(
			<RadioGroup defaultValue="apple" aria-label="Fruit">
				<Radio value="apple" aria-label="Apple" />
				<Radio value="orange" aria-label="Orange" />
			</RadioGroup>
		);

		const apple = screen.getByRole( 'radio', { name: 'Apple' } );
		const orange = screen.getByRole( 'radio', { name: 'Orange' } );

		expect( apple ).toBeChecked();

		await user.click( orange );

		expect( apple ).not.toBeChecked();
		expect( orange ).toBeChecked();
	} );
} );
