import { render } from 'vitest-browser-react';
import { page, userEvent } from 'vitest/browser';
import { describe, expect, it, vi } from 'vitest';
import AddFilter from '../add-filter';
import type { NormalizedFilter } from '../../../types';

const filter: NormalizedFilter = {
	field: 'author',
	name: 'Author',
	hasElements: false,
	singleSelection: true,
	operators: [ 'is' ],
	isVisible: false,
	isPrimary: false,
	isLocked: false,
};

function FilterMenu( { isVisible }: { isVisible: boolean } ) {
	return (
		<>
			<AddFilter
				filters={ [ { ...filter, isVisible } ] }
				view={ { type: 'table' } }
				onChangeView={ vi.fn() }
				setOpenedFilter={ vi.fn() }
			/>
			<button>Outside</button>
		</>
	);
}

describe( 'Add filter menu', () => {
	it( 'keeps the disabled trigger focusable and prevents opening', async () => {
		await render( <FilterMenu isVisible /> );
		const trigger = page.getByRole( 'button', { name: 'Add filter' } );

		await expect
			.element( trigger )
			.toHaveAttribute( 'aria-disabled', 'true' );
		await userEvent.tab();
		await expect.element( trigger ).toHaveFocus();
		await userEvent.keyboard( '{Enter}{ArrowDown} ' );
		await expect
			.element( page.getByRole( 'menu' ) )
			.not.toBeInTheDocument();
		await userEvent.click( trigger, { force: true } );
		await expect
			.element( page.getByRole( 'menu' ) )
			.not.toBeInTheDocument();
	} );

	it.each( [ 'Escape', 'outside click' ] )(
		'dismisses the open menu with %s after all filters become active',
		async ( dismissal ) => {
			const screen = await render( <FilterMenu isVisible={ false } /> );
			await userEvent.click(
				page.getByRole( 'button', { name: 'Add filter' } )
			);
			await expect.element( page.getByRole( 'menu' ) ).toBeVisible();

			await screen.rerender( <FilterMenu isVisible /> );
			await expect.element( page.getByRole( 'menu' ) ).toBeVisible();

			if ( dismissal === 'Escape' ) {
				await userEvent.keyboard( '{Escape}' );
			} else {
				// Click through the modal backdrop at the outside button's position.
				await userEvent.click(
					page.getByRole( 'button', { name: 'Outside' } ),
					{ force: true }
				);
			}
			await expect
				.element( page.getByRole( 'menu' ) )
				.not.toBeInTheDocument();
		}
	);
} );
