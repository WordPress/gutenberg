import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
// eslint-disable-next-line @wordpress/use-recommended-components
import { Menu } from '@wordpress/ui';
import IntentSwitcher from '..';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/data' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		useSelect: vi.fn( () => ( {
			intent: 'edit',
			isRichEditingEnabled: true,
		} ) ),
		useDispatch: vi.fn( () => ( {} ) ),
	} as unknown as typeof original;
} );

// The real store module registers private actions through `unlock`, which
// the identity mock below cannot do.
vi.mock(
	import( '../../../store' ),
	() => ( { store: {} } ) as unknown as typeof import( '../../../store' )
);

vi.mock( import( '../../../lock-unlock' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		unlock: ( value: unknown ) => value,
	} as unknown as typeof original;
} );

vi.mock(
	import( '../../post-type-support-check' ),
	async ( importOriginal ) => {
		const original = await importOriginal();

		return {
			...original,
			default: ( { children }: { children: ReactNode } ) => children,
		} as unknown as typeof original;
	}
);

describe( 'IntentSwitcher', () => {
	it( 'renders the intents as radio items under a Mode label', async () => {
		const user = userEvent.setup();
		render(
			<Menu.Root>
				<Menu.Trigger>Options</Menu.Trigger>
				<Menu.Popup>
					<IntentSwitcher />
				</Menu.Popup>
			</Menu.Root>
		);

		await user.click( screen.getByRole( 'button', { name: 'Options' } ) );

		expect(
			await screen.findByRole( 'group', { name: 'Mode' } )
		).toBeInTheDocument();
		expect(
			screen.getByRole( 'menuitemradio', { name: /Editing/ } )
		).toBeChecked();
		expect(
			screen.getByRole( 'menuitemradio', { name: /Suggesting/ } )
		).not.toBeChecked();
	} );
} );
