import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { describe, expect, it, vi } from 'vitest';
import { RadioGroup } from '../../primitives';
import { CardRadio } from '../index';

globalThis.wpVitest.mockPointerEvent();

describe( 'CardRadio', () => {
	it( 'forwards ref to the radio', () => {
		const ref = createRef< HTMLSpanElement >();

		render(
			<RadioGroup aria-label="Plan">
				<CardRadio ref={ ref } value="a" label="Option A" />
			</RadioGroup>
		);

		expect( ref.current ).toBe( screen.getByRole( 'radio' ) );
	} );

	it( 'names the radio with the label and describes it with the description only', () => {
		render(
			<RadioGroup aria-label="Plan">
				<CardRadio value="a" label="Option A" description="First">
					Additional content
				</CardRadio>
			</RadioGroup>
		);

		const radio = screen.getByRole( 'radio', {
			name: 'Option A',
			description: 'First',
		} );
		expect( radio ).toBeVisible();
		expect( screen.getByText( 'Additional content' ) ).toBeVisible();
	} );

	it( 'selects the radio when the label is clicked', async () => {
		const user = userEvent.setup();
		const onValueChange = vi.fn();

		render(
			<RadioGroup aria-label="Plan" onValueChange={ onValueChange }>
				<CardRadio value="a" label="Option A" />
				<CardRadio value="b" label="Option B" />
			</RadioGroup>
		);

		await user.click( screen.getByText( 'Option B' ) );

		expect(
			screen.getByRole( 'radio', { name: 'Option B' } )
		).toBeChecked();
		expect( onValueChange ).toHaveBeenCalledWith( 'b', expect.anything() );
	} );

	it( 'does not select a disabled radio', async () => {
		const user = userEvent.setup();

		render(
			<RadioGroup aria-label="Plan" defaultValue="a">
				<CardRadio value="a" label="Option A" />
				<CardRadio value="b" label="Option B" disabled />
			</RadioGroup>
		);

		await user.click( screen.getByText( 'Option B' ) );

		expect(
			screen.getByRole( 'radio', { name: 'Option B' } )
		).not.toBeChecked();
		expect(
			screen.getByRole( 'radio', { name: 'Option A' } )
		).toBeChecked();
	} );
} );
