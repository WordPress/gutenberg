import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DeletedNavigationWarning from '../deleted-navigation-warning';

describe( 'DeletedNavigationWarning', () => {
	it( 'does not offer menu creation without permission', () => {
		render( <DeletedNavigationWarning onCreateNew={ vi.fn() } /> );

		expect(
			screen.getByText(
				'Navigation Menu has been deleted or is unavailable.'
			)
		).toBeVisible();
		expect(
			screen.queryByRole( 'button', { name: 'Create a new Menu?' } )
		).not.toBeInTheDocument();
	} );

	it( 'offers menu creation when the user has permission', async () => {
		const user = userEvent.setup();
		const onCreateNew = vi.fn();
		render(
			<DeletedNavigationWarning onCreateNew={ onCreateNew } canCreate />
		);

		await user.click(
			screen.getByRole( 'button', { name: 'Create a new Menu?' } )
		);
		expect( onCreateNew ).toHaveBeenCalledTimes( 1 );
	} );
} );
