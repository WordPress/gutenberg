import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import useConstrainedTabbing from '../';

function ConstrainedTabbing() {
	const ref = useConstrainedTabbing();
	return (
		<>
			<button type="button">Outside before</button>
			<div ref={ ref }>
				<button type="button">First</button>
				<div tabIndex={ -1 }>Placeholder</div>
				<button type="button">Middle</button>
				<button type="button">Last</button>
			</div>
			<button type="button">Outside after</button>
		</>
	);
}

describe( 'useConstrainedTabbing', () => {
	it( 'moves focus to the first tabbable element when pressing Tab on the last one', async () => {
		await render( <ConstrainedTabbing /> );

		await userEvent.click( page.getByRole( 'button', { name: 'Last' } ) );
		await userEvent.tab();

		await expect
			.element( page.getByRole( 'button', { name: 'First' } ) )
			.toHaveFocus();
	} );

	it( 'moves focus to the last tabbable element when pressing Shift+Tab on the first one', async () => {
		await render( <ConstrainedTabbing /> );

		await userEvent.click( page.getByRole( 'button', { name: 'First' } ) );
		await userEvent.tab( { shift: true } );

		await expect
			.element( page.getByRole( 'button', { name: 'Last' } ) )
			.toHaveFocus();
	} );

	// See https://github.com/WordPress/gutenberg/issues/34681.
	it( 'moves focus to the next tabbable element when pressing Tab on a programmatically focused element', async () => {
		await render( <ConstrainedTabbing /> );

		const placeholder = page.getByText( 'Placeholder' );
		placeholder.element().focus();
		await expect.element( placeholder ).toHaveFocus();

		await userEvent.tab();

		await expect
			.element( page.getByRole( 'button', { name: 'Middle' } ) )
			.toHaveFocus();
	} );
} );
