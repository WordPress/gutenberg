import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import * as Combobox from '../index';
import { addCanvasButton } from '../../../test/iframe';

describe( 'Combobox iframe dismissal', () => {
	it( 'closes Combobox and delivers the iframe click', async () => {
		const onCanvasClick = vi.fn();
		await render(
			<>
				<Combobox.Root items={ [ 'First' ] }>
					<Combobox.Trigger>Select</Combobox.Trigger>
					<Combobox.Popup>
						<Combobox.Input placeholder="Search" />
						<Combobox.List>
							<Combobox.ListBody>
								<Combobox.Item value="First">
									<Combobox.ItemLabel>
										First
									</Combobox.ItemLabel>
								</Combobox.Item>
							</Combobox.ListBody>
						</Combobox.List>
					</Combobox.Popup>
				</Combobox.Root>
				<iframe
					title="Editor canvas"
					style={ { position: 'fixed', left: 400, top: 300 } }
				/>
			</>
		);
		const canvasButton = addCanvasButton( onCanvasClick );

		await userEvent.click( screen.getByRole( 'combobox' ) );
		await expect
			.element( page.getByRole( 'option', { name: 'First' } ) )
			.toBeVisible();
		await canvasButton.click();

		await waitFor( () => {
			expect(
				screen.queryByRole( 'option', { name: 'First' } )
			).not.toBeInTheDocument();
		} );
		expect( onCanvasClick ).toHaveBeenCalledTimes( 1 );
	} );
} );
