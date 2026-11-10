import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SortImagesControl, SourceOrderControl } from '../order-controls';

globalThis.wpVitest.mockMatchMedia();
globalThis.wpVitest.mockResizeObserver();

describe( 'Gallery ordering controls', () => {
	test.each( [ false, true ] )(
		'does not repeat a dynamic order change when the current item is selected, with Random %s',
		async ( isRandom ) => {
			const onChange = vi.fn();
			const onSelectRandom = vi.fn();
			render(
				<SourceOrderControl
					order={ { orderby: 'date', order: 'desc' } }
					isRandom={ isRandom }
					onChange={ onChange }
					onSelectRandom={ onSelectRandom }
				/>
			);

			await userEvent.click(
				screen.getByRole( 'combobox', { name: 'Order by' } )
			);
			await userEvent.click(
				await screen.findByRole( 'option', {
					name: isRandom ? 'Random' : 'Newest to oldest',
				} )
			);

			expect( onChange ).not.toHaveBeenCalled();
			expect( onSelectRandom ).not.toHaveBeenCalled();
		}
	);

	test.each( [ false, true ] )(
		'does not sort images again when the current order is selected, with Random %s',
		async ( isRandom ) => {
			const onSort = vi.fn();
			const onSelectCustom = vi.fn();
			const onSelectRandom = vi.fn();
			render(
				<SortImagesControl
					currentOrder={ { orderby: 'title', order: 'asc' } }
					isRandom={ isRandom }
					canSort
					onSort={ onSort }
					onSelectCustom={ onSelectCustom }
					onSelectRandom={ onSelectRandom }
				/>
			);

			await userEvent.click(
				screen.getByRole( 'combobox', { name: 'Order by' } )
			);
			await userEvent.click(
				await screen.findByRole( 'option', {
					name: isRandom ? 'Random' : 'A → Z',
				} )
			);

			expect( onSort ).not.toHaveBeenCalled();
			expect( onSelectCustom ).not.toHaveBeenCalled();
			expect( onSelectRandom ).not.toHaveBeenCalled();
		}
	);
} );
