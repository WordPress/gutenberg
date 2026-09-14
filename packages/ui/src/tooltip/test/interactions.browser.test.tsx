import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import * as Tooltip from '../index';

describe( 'Tooltip interactions', () => {
	it( 'shows tooltip on hover', async () => {
		await render(
			<Tooltip.Provider delay={ 0 }>
				<Tooltip.Root>
					<Tooltip.Trigger>Hover me</Tooltip.Trigger>
					<Tooltip.Popup>Tooltip content</Tooltip.Popup>
				</Tooltip.Root>
			</Tooltip.Provider>
		);

		await page.getByRole( 'button', { name: 'Hover me' } ).hover();
		await expect
			.element( page.getByText( 'Tooltip content' ) )
			.toBeVisible();
	} );

	it( 'does not show tooltip when disabled', async () => {
		await render(
			<Tooltip.Provider delay={ 0 }>
				<Tooltip.Root disabled>
					<Tooltip.Trigger>Hover me</Tooltip.Trigger>
					<Tooltip.Popup>Tooltip content</Tooltip.Popup>
				</Tooltip.Root>
			</Tooltip.Provider>
		);

		await page.getByRole( 'button', { name: 'Hover me' } ).hover();
		await expect
			.element( page.getByText( 'Tooltip content' ) )
			.not.toBeInTheDocument();
	} );
} );
