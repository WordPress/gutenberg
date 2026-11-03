import type { ComponentProps } from 'react';
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { useState } from '@wordpress/element';
import RichTextControl from '../';

describe( 'RichTextControl autocomplete', () => {
	it( 'points the textbox at the suggestions listbox once a completer matches', async () => {
		// Held outside the completer: the options are reported back through an
		// effect keyed on their identity, so rebuilding them per render loops.
		const items = [ { key: 'alice', value: 'Alice', label: 'Alice' } ];
		const completer = {
			name: 'test/mentions',
			triggerPrefix: '@',
			useItems: () => [ items ],
			getOptionCompletion: () => '@Alice',
		};

		function ControlledRichText() {
			const [ value, setValue ] = useState( '' );
			return (
				<RichTextControl
					label="Note"
					value={ value }
					onChange={ setValue }
					completers={
						[ completer ] as unknown as ComponentProps<
							typeof RichTextControl
						>[ 'completers' ]
					}
				/>
			);
		}

		await render( <ControlledRichText /> );

		const user = userEvent.setup();
		const textbox = page.getByRole( 'textbox', { name: 'Note' } );
		await user.click( textbox );
		await user.type( textbox, '@' );

		const listbox = page.getByRole( 'listbox' );
		const option = page.getByRole( 'option', { name: 'Alice' } );

		await expect.element( listbox ).toBeVisible();
		await expect.element( option ).toBeVisible();
		await expect
			.element( textbox )
			.toHaveAttribute( 'aria-autocomplete', 'list' );
		await expect
			.element( textbox )
			.toHaveAttribute( 'aria-haspopup', 'listbox' );
		await expect
			.element( textbox )
			.toHaveAttribute( 'aria-controls', listbox.element().id );
		await expect
			.element( textbox )
			.toHaveAttribute( 'aria-activedescendant', option.element().id );
	} );
} );
