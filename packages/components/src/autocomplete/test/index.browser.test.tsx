import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import { useRef } from '@wordpress/element';
import { useAutocomplete } from '..';
import '../../style.scss';

function makeRecord( text: string ) {
	return {
		text,
		formats: [],
		replacements: [],
		start: text.length,
		end: text.length,
	};
}

describe( 'Autocomplete hover navigation', () => {
	it( 'selects a hovered result without moving text focus and uses it for keyboard completion', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn();
		const items = [
			{ key: 'apple', value: 'Apple', label: 'Apple', isDisabled: false },
			{
				key: 'orange',
				value: 'Orange',
				label: 'Orange',
				isDisabled: false,
			},
			{
				key: 'grapes',
				value: 'Grapes',
				label: 'Grapes',
				isDisabled: false,
			},
		];
		const completers = [
			{
				name: 'fruit',
				triggerPrefix: '~',
				options: [],
				useItems: () => [ items ] as const,
				getOptionLabel: ( option: string ) => option,
				getOptionCompletion: ( option: string ) => option,
			},
		];

		function AutocompleteInput() {
			const contentRef = useRef< HTMLInputElement >( null );
			const { popover, activeId, onKeyDown } = useAutocomplete( {
				record: makeRecord( '~' ),
				onChange,
				onReplace: vi.fn(),
				completers,
				contentRef,
			} );
			return (
				<>
					<input
						aria-label="Complete a fruit"
						aria-activedescendant={ activeId ?? undefined }
						defaultValue="~"
						ref={ contentRef }
						onKeyDown={ ( event ) =>
							onKeyDown( event.nativeEvent )
						}
					/>
					{ popover }
				</>
			);
		}

		await render( <AutocompleteInput /> );
		const input = screen.getByRole( 'textbox' );
		await user.tab();
		const orange = await screen.findByRole( 'option', { name: 'Orange' } );
		await user.hover( orange );
		expect( orange ).toHaveAttribute( 'aria-selected', 'true' );
		expect( input ).toHaveAttribute( 'aria-activedescendant', orange.id );
		expect( input ).toHaveFocus();

		await user.keyboard( '[ArrowDown]' );
		expect(
			screen.getByRole( 'option', { name: 'Grapes' } )
		).toHaveAttribute( 'aria-selected', 'true' );
		await user.keyboard( '[Enter]' );
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { text: 'Grapes' } )
		);
	} );
} );
