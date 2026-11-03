import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { describe, expect, it } from 'vitest';
import { Checkbox } from '../../checkbox';
import { CheckboxGroup } from '../index';

declare const wpVitest: {
	mockPointerEvent: () => void;
};

wpVitest.mockPointerEvent();

describe( 'CheckboxGroup', () => {
	it( 'forwards ref on the group and on NestedItems', () => {
		const groupRef = createRef< HTMLDivElement >();
		const nestedRef = createRef< HTMLDivElement >();

		render(
			<CheckboxGroup ref={ groupRef } defaultValue={ [] }>
				<Checkbox value="a" aria-label="A" />
				<CheckboxGroup.NestedItems ref={ nestedRef }>
					<Checkbox value="b" aria-label="B" />
				</CheckboxGroup.NestedItems>
			</CheckboxGroup>
		);

		expect( groupRef.current ).toBeInstanceOf( HTMLDivElement );
		expect( nestedRef.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'selects multiple values in uncontrolled mode', async () => {
		const user = userEvent.setup();

		render(
			<CheckboxGroup defaultValue={ [] } aria-label="Fruit">
				<Checkbox value="apple" aria-label="Apple" />
				<Checkbox value="orange" aria-label="Orange" />
			</CheckboxGroup>
		);

		const apple = screen.getByRole( 'checkbox', { name: 'Apple' } );
		const orange = screen.getByRole( 'checkbox', { name: 'Orange' } );

		expect( apple ).not.toBeChecked();
		expect( orange ).not.toBeChecked();

		await user.click( apple );
		await user.click( orange );

		expect( apple ).toBeChecked();
		expect( orange ).toBeChecked();
	} );

	it( 'parent checkbox checks all values listed in allValues', async () => {
		const user = userEvent.setup();

		render(
			<CheckboxGroup
				defaultValue={ [] }
				allValues={ [ 'apple', 'orange' ] }
				aria-label="Fruit"
			>
				<Checkbox parent value="fruit" aria-label="Fruit" />
				<Checkbox value="apple" aria-label="Apple" />
				<Checkbox value="orange" aria-label="Orange" />
			</CheckboxGroup>
		);

		await user.click( screen.getByRole( 'checkbox', { name: 'Fruit' } ) );

		expect(
			screen.getByRole( 'checkbox', { name: 'Fruit' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'checkbox', { name: 'Apple' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'checkbox', { name: 'Orange' } )
		).toBeChecked();
	} );

	it( 'parent checkbox is mixed when some child values are selected', () => {
		render(
			<CheckboxGroup
				defaultValue={ [ 'apple' ] }
				allValues={ [ 'apple', 'orange' ] }
				aria-label="Fruit"
			>
				<Checkbox parent value="fruit" aria-label="Fruit" />
				<Checkbox value="apple" aria-label="Apple" />
				<Checkbox value="orange" aria-label="Orange" />
			</CheckboxGroup>
		);

		expect(
			screen.getByRole( 'checkbox', { name: 'Fruit' } )
		).toBePartiallyChecked();
		expect(
			screen.getByRole( 'checkbox', { name: 'Apple' } )
		).toBeChecked();
		expect(
			screen.getByRole( 'checkbox', { name: 'Orange' } )
		).not.toBeChecked();
	} );
} );
