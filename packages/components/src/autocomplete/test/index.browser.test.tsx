import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import {
	Suspense,
	startTransition,
	useRef,
	useState,
} from '@wordpress/element';
import { useAutocomplete, useAutocompleteProps } from '..';
import type { UseAutocompleteProps } from '../types';
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
						// eslint-disable-next-line jsx-a11y/no-autofocus -- Set initial focus independently of test order.
						autoFocus
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

describe( 'useAutocompleteProps', () => {
	it( 'uses the committed completion callback while an update is suspended', async () => {
		const user = userEvent.setup();
		const onChange = vi.fn< UseAutocompleteProps[ 'onChange' ] >();
		const pendingOnChange = vi.fn< UseAutocompleteProps[ 'onChange' ] >();
		const suspend = vi.fn();
		const pending = new Promise< never >( () => {} );
		const items = [
			{
				key: 'apple',
				value: 'Apple',
				label: 'Apple',
				keywords: [],
				isDisabled: false,
			},
		];
		const completers = [
			{
				name: 'fruit',
				triggerPrefix: '~',
				options: [],
				useItems: () => [ items ] as const,
				getOptionLabel: ( value: string ) => value,
				getOptionCompletion: ( value: string ) => value,
			},
		];

		function AutocompleteInput( {
			onComplete,
		}: {
			onComplete: UseAutocompleteProps[ 'onChange' ];
		} ) {
			const [ record, setRecord ] = useState( makeRecord( '' ) );
			const { children, ...props } = useAutocompleteProps( {
				record,
				onChange: onComplete,
				onReplace: () => {},
				completers,
			} );

			return (
				<>
					<div
						{ ...props }
						role="textbox"
						aria-label="Complete a fruit"
						contentEditable
						onInput={ ( event ) =>
							setRecord(
								makeRecord(
									event.currentTarget.textContent ?? ''
								)
							)
						}
					/>
					{ children }
				</>
			);
		}

		function PendingUpdate(): never {
			suspend();
			throw pending;
		}

		const { rerender } = await render(
			<Suspense fallback="Loading">
				<AutocompleteInput onComplete={ onChange } />
			</Suspense>
		);
		await user.click( screen.getByRole( 'textbox' ) );
		await user.keyboard( '~' );
		await screen.findByRole( 'option', { name: 'Apple' } );

		let update: ReturnType< typeof rerender > | undefined;
		startTransition( () => {
			update = rerender(
				<Suspense fallback="Loading">
					<AutocompleteInput onComplete={ pendingOnChange } />
					<PendingUpdate />
				</Suspense>
			);
		} );
		await update;
		expect( suspend ).toHaveBeenCalled();
		expect( screen.queryByText( 'Loading' ) ).not.toBeInTheDocument();

		await user.keyboard( '[Enter]' );

		expect( pendingOnChange ).not.toHaveBeenCalled();
		expect( onChange ).toHaveBeenCalledWith(
			expect.objectContaining( { text: 'Apple' } )
		);
	} );
} );
