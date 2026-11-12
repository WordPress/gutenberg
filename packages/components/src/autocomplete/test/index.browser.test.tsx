import { describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { act, screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import {
	Suspense,
	startTransition,
	useRef,
	useState,
} from '@wordpress/element';
import type { RichTextValue } from '@wordpress/rich-text';
import { useAutocomplete, useAutocompleteProps } from '..';
import type { UseAutocompleteProps, WPCompleter } from '../types';
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

const OTHER_COMPLETER: WPCompleter< string > = {
	name: 'other',
	triggerPrefix: '/',
	options: [ 'Other' ],
	getOptionLabel: ( option ) => option,
	getOptionCompletion: ( option ) => option,
};

function ProviderField( { completer }: { completer: WPCompleter< string > } ) {
	const contentRef = useRef< HTMLTextAreaElement >( null );
	const [ record, setRecord ] = useState< RichTextValue >( () =>
		makeRecord( '' )
	);
	const { popover, onKeyDown, listBoxId, activeId } = useAutocomplete( {
		record: {
			...record,
			start: record.start ?? record.text.length,
			end: record.end ?? record.text.length,
		},
		contentRef,
		// Callers can recreate the array and configuration on render.
		completers: [ { ...completer }, OTHER_COMPLETER ],
		onChange: setRecord,
		onReplace: () => {},
	} );

	return (
		<>
			<textarea
				aria-label="Complete a fruit"
				aria-controls={ listBoxId }
				aria-activedescendant={ activeId ?? undefined }
				ref={ contentRef }
				value={ record.text }
				onChange={ ( event ) =>
					setRecord( makeRecord( event.target.value ) )
				}
				onKeyDown={ ( event ) => onKeyDown( event.nativeEvent ) }
			/>
			{ popover }
		</>
	);
}

const FRUIT_COMPLETER: WPCompleter< string > = {
	name: 'fruit',
	triggerPrefix: '~',
	options: [ 'Apple' ],
	getOptionLabel: ( option ) => option,
	getOptionCompletion: ( option ) => `Old ${ option }`,
};

function useCustomFruitItems() {
	const [ items ] = useState( [
		{
			key: 'custom-apricot',
			value: 'Apricot',
			label: 'Apricot',
			isDisabled: false,
		},
	] );
	return [ items ] as const;
}

describe( 'Autocomplete provider updates', () => {
	it( 'refreshes results and keyboard completion when the provider changes', async () => {
		const user = userEvent.setup();
		const view = await render(
			<ProviderField completer={ FRUIT_COMPLETER } />
		);
		const field = screen.getByRole( 'textbox', {
			name: 'Complete a fruit',
		} );
		await user.click( field );
		await user.keyboard( '~Ap' );
		await screen.findByRole( 'option', { name: 'Apple' } );

		await view.rerender(
			<ProviderField
				completer={ {
					...FRUIT_COMPLETER,
					options: [ 'Apricot' ],
					getOptionCompletion: ( option ) => `New ${ option }`,
				} }
			/>
		);
		await screen.findByRole( 'option', { name: 'Apricot' } );
		expect( field ).toHaveFocus();
		await user.keyboard( '{Enter}' );
		expect( field ).toHaveValue( 'New Apricot' );
	} );

	it( 'completes visible results with their provider while replacement results load', async () => {
		const user = userEvent.setup();
		let resolve!: ( options: string[] ) => void;
		const pending = new Promise< string[] >( ( done ) => {
			resolve = done;
		} );
		const view = await render(
			<ProviderField completer={ FRUIT_COMPLETER } />
		);
		const field = screen.getByRole( 'textbox', {
			name: 'Complete a fruit',
		} );
		await user.click( field );
		await user.keyboard( '~Ap' );
		await screen.findByRole( 'option', { name: 'Apple' } );

		await view.rerender(
			<ProviderField
				completer={ {
					...FRUIT_COMPLETER,
					options: () => pending,
					getOptionCompletion: ( option ) => `New ${ option }`,
				} }
			/>
		);
		await expect
			.element( page.getByRole( 'option', { name: 'Apple' } ) )
			.toBeVisible();
		expect( field ).toHaveFocus();
		await user.keyboard( '{Enter}' );
		expect( field ).toHaveValue( 'Old Apple' );
		await act( async () => resolve( [ 'Apricot' ] ) );
	} );

	it( 'allows a new line after a completion that keeps its trigger', async () => {
		const user = userEvent.setup();
		await render(
			<ProviderField
				completer={ {
					...FRUIT_COMPLETER,
					triggerPrefix: '@',
					getOptionCompletion: ( option ) => `@${ option }`,
				} }
			/>
		);
		const field = screen.getByRole( 'textbox', {
			name: 'Complete a fruit',
		} );
		await user.click( field );
		await user.keyboard( '@Ap' );
		await screen.findByRole( 'option', { name: 'Apple' } );
		await user.keyboard( '{Enter}' );
		expect( field ).toHaveValue( '@Apple' );
		await user.keyboard( ' extra{Enter}' );
		expect( field ).toHaveValue( '@Apple extra\n' );
		expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
	} );

	it( 'switches between default items and a custom items hook without losing the query', async () => {
		const user = userEvent.setup();
		const view = await render(
			<ProviderField completer={ FRUIT_COMPLETER } />
		);
		const field = screen.getByRole( 'textbox', {
			name: 'Complete a fruit',
		} );
		await user.click( field );
		await user.keyboard( '~Ap' );
		await screen.findByRole( 'option', { name: 'Apple' } );

		await view.rerender(
			<ProviderField
				completer={ {
					...FRUIT_COMPLETER,
					useItems: useCustomFruitItems,
				} }
			/>
		);
		await screen.findByRole( 'option', { name: 'Apricot' } );
		expect( field ).toHaveValue( '~Ap' );
		await view.rerender(
			<ProviderField
				completer={ {
					...FRUIT_COMPLETER,
					getOptionCompletion: ( option ) => `Restored ${ option }`,
				} }
			/>
		);
		await screen.findByRole( 'option', { name: 'Apple' } );
		expect( field ).toHaveFocus();
		await user.keyboard( '{Enter}' );
		expect( field ).toHaveValue( 'Restored Apple' );
	} );
} );
