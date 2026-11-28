import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
import ContentEditableControl from '..';

describe( 'ContentEditableControl', () => {
	it( 'does not focus a disabled field when it or its label is clicked', async () => {
		const onMouseDown = vi.fn();
		await render(
			<ContentEditableControl
				label="Note"
				disabled
				onMouseDown={ onMouseDown }
			/>
		);
		const textbox = screen.getByRole( 'textbox' );

		// Playwright waits for an `aria-disabled` element to become enabled
		// before clicking it, so skip that check.
		await userEvent.click( textbox, { force: true } );
		expect( textbox ).not.toHaveFocus();
		expect( onMouseDown ).toHaveBeenCalledTimes( 1 );

		await userEvent.click( screen.getByText( 'Note' ) );
		expect( textbox ).not.toHaveFocus();
	} );
} );
