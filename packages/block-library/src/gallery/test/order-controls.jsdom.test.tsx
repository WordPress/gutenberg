import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortImagesControl, SourceOrderControl } from '../order-controls';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

describe( 'Gallery ordering controls', () => {
	test( 'does not repeat a dynamic order change when the current item is selected', async () => {
		const onChange = vi.fn();
		render(
			<SourceOrderControl
				order={ { orderby: 'date', order: 'desc' } }
				isRandom={ false }
				onChange={ onChange }
				onSelectRandom={ vi.fn() }
			/>
		);

		await userEvent.click(
			screen.getByRole( 'combobox', { name: 'Order by' } )
		);
		await userEvent.click(
			await screen.findByRole( 'option', {
				name: 'Newest to oldest',
			} )
		);

		expect( onChange ).not.toHaveBeenCalled();
	} );

	test( 'does not sort images again when the current order is selected', async () => {
		const onSort = vi.fn();
		render(
			<SortImagesControl
				currentOrder={ { orderby: 'title', order: 'asc' } }
				isRandom={ false }
				canSort
				onSort={ onSort }
				onSelectCustom={ vi.fn() }
				onSelectRandom={ vi.fn() }
			/>
		);

		await userEvent.click(
			screen.getByRole( 'combobox', { name: 'Order by' } )
		);
		await userEvent.click(
			await screen.findByRole( 'option', {
				name: 'A → Z',
			} )
		);

		expect( onSort ).not.toHaveBeenCalled();
	} );
} );
