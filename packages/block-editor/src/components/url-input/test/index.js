/**
 * External dependencies
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { useState } from '@wordpress/element';
import { dispatch } from '@wordpress/data';
import { UP, DOWN, ENTER, TAB } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import URLInput from '../';
import { store as blockEditorStore } from '../../../store';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

const SUGGESTIONS = [
	{
		id: 1,
		title: 'Hello world',
		type: 'post',
		url: 'https://example.com/hello-world',
	},
	{
		id: 2,
		title: 'Sample page',
		type: 'page',
		url: 'https://example.com/sample-page',
	},
];

// `@wordpress/keycodes` matches on `event.keyCode`, which `userEvent` does not set.
const KEY_EVENTS = {
	up: { key: 'ArrowUp', keyCode: UP },
	down: { key: 'ArrowDown', keyCode: DOWN },
	enter: { key: 'Enter', keyCode: ENTER },
	tab: { key: 'Tab', keyCode: TAB },
};

/**
 * Waits long enough for the suggestions request debounce to elapse, so that
 * assertions about a request _not_ being made are meaningful.
 */
function flushDebounce() {
	return new Promise( ( resolve ) => setTimeout( resolve, 250 ) );
}

/**
 * `URLInput` is a controlled component, so most interactions require an owner
 * that holds on to the value.
 *
 * @param {Object} props Props passed through to `URLInput`, with `value` used
 *                       as the initial value.
 */
function ControlledURLInput( props ) {
	const { onChange, value: initialValue = '', ...restProps } = props;
	const [ value, setValue ] = useState( initialValue );

	return (
		<URLInput
			{ ...restProps }
			value={ value }
			onChange={ ( newValue, suggestion ) => {
				setValue( newValue );
				onChange?.( newValue, suggestion );
			} }
		/>
	);
}

describe( 'URLInput', () => {
	let fetchLinkSuggestions;

	beforeEach( () => {
		fetchLinkSuggestions = jest.fn().mockResolvedValue( SUGGESTIONS );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	function renderURLInput( props = {} ) {
		const user = userEvent.setup();
		const onChange = jest.fn();

		render(
			<ControlledURLInput
				onChange={ onChange }
				__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				{ ...props }
			/>
		);

		return { user, onChange, input: screen.getByRole( 'combobox' ) };
	}

	// Mounting with a value requests suggestions for it, so the list is open
	// by the time this resolves.
	async function renderWithSuggestions( props = {} ) {
		const utils = renderURLInput( { value: 'hello', ...props } );
		await screen.findByRole( 'listbox' );
		return utils;
	}

	describe( 'rendering', () => {
		it( 'should fall back to a generic accessible name when no label is provided', () => {
			const { rerender } = render(
				<URLInput value="" onChange={ () => {} } />
			);

			const input = screen.getByRole( 'combobox', { name: 'URL' } );

			expect( input ).toBeVisible();
			expect( input ).toHaveAttribute( 'aria-expanded', 'false' );

			rerender(
				<URLInput label="Link" value="" onChange={ () => {} } />
			);

			expect(
				screen.getByRole( 'combobox', { name: /Link/ } )
			).toBeVisible();
		} );

		it( 'should call `onChange` with the new value only', async () => {
			const { user, input, onChange } = renderURLInput();

			await user.type( input, 'abc' );

			expect( onChange ).toHaveBeenCalledTimes( 3 );
			// The second argument is reserved for a selected suggestion, so the
			// `{ event }` object `InputControl` passes must not reach callers.
			expect( onChange ).toHaveBeenLastCalledWith( 'abc', undefined );
		} );
	} );

	describe( 'fetching suggestions', () => {
		it( 'should display suggestions for the typed value', async () => {
			const { user, input } = renderURLInput();

			await user.type( input, 'hello' );

			expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 2 );
			expect( input ).toHaveAttribute( 'aria-expanded', 'true' );
			// Typing five characters is debounced into a single request.
			expect( fetchLinkSuggestions ).toHaveBeenCalledTimes( 1 );
			expect( fetchLinkSuggestions ).toHaveBeenCalledWith( 'hello', {
				isInitialSuggestions: false,
			} );
		} );

		it( 'should not fetch suggestions for fewer than two characters', async () => {
			const { user, input } = renderURLInput();

			await user.type( input, 'h' );
			await flushDebounce();

			expect( fetchLinkSuggestions ).not.toHaveBeenCalled();
			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should not fetch suggestions for a direct URL entry', async () => {
			const { user, input } = renderURLInput();

			await user.type( input, 'https://example.com' );
			await flushDebounce();

			expect( fetchLinkSuggestions ).not.toHaveBeenCalled();
		} );

		it( 'should fetch suggestions for a direct URL entry when `__experimentalHandleURLSuggestions` is set', async () => {
			const { user, input } = renderURLInput( {
				__experimentalHandleURLSuggestions: true,
			} );

			await user.type( input, 'https://example.com' );

			expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
			expect( fetchLinkSuggestions ).toHaveBeenCalledWith(
				'https://example.com',
				{ isInitialSuggestions: false }
			);
		} );

		it( 'should fetch initial suggestions on mount when `__experimentalShowInitialSuggestions` is set', async () => {
			renderURLInput( { __experimentalShowInitialSuggestions: true } );

			expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
			expect( fetchLinkSuggestions ).toHaveBeenCalledWith( '', {
				isInitialSuggestions: true,
			} );
		} );

		it( 'should fetch suggestions on mount for a value that is already present', async () => {
			renderURLInput( { value: 'hello' } );

			expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
			expect( fetchLinkSuggestions ).toHaveBeenCalledWith( 'hello', {
				isInitialSuggestions: false,
			} );
		} );

		it( 'should not fetch initial suggestions on mount when `disableSuggestions` is set', async () => {
			renderURLInput( {
				__experimentalShowInitialSuggestions: true,
				disableSuggestions: true,
			} );

			await flushDebounce();

			expect( fetchLinkSuggestions ).not.toHaveBeenCalled();
			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should fetch suggestions on focus when the previous search returned no results', async () => {
			let resolveMountRequest;
			fetchLinkSuggestions
				.mockImplementationOnce(
					() =>
						new Promise( ( resolve ) => {
							resolveMountRequest = resolve;
						} )
				)
				.mockResolvedValue( SUGGESTIONS );

			const { user, input } = renderURLInput( { value: 'hello' } );

			await waitFor( () =>
				expect( fetchLinkSuggestions ).toHaveBeenCalledTimes( 1 )
			);

			// The request made on mount returns no results. The spinner is only
			// removed once it has settled.
			resolveMountRequest( [] );
			await waitFor( () =>
				expect(
					screen.queryByRole( 'presentation' )
				).not.toBeInTheDocument()
			);

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();

			await user.click( input );

			expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
			expect( fetchLinkSuggestions ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should not fetch suggestions again on refocus when suggestions are already displayed', async () => {
			const { user, input } = await renderWithSuggestions();

			await user.click( input );
			await user.tab();
			await user.click( input );
			await flushDebounce();

			expect( fetchLinkSuggestions ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should hide the suggestions when the value is cleared', async () => {
			const { user, input } = await renderWithSuggestions();

			await user.clear( input );

			await waitFor( () =>
				expect(
					screen.queryByRole( 'listbox' )
				).not.toBeInTheDocument()
			);
		} );

		it( 'should ignore the response of a superseded request', async () => {
			let resolveStaleRequest;
			fetchLinkSuggestions
				.mockImplementationOnce(
					() =>
						new Promise( ( resolve ) => {
							resolveStaleRequest = resolve;
						} )
				)
				.mockResolvedValue( SUGGESTIONS );

			const { user, input } = renderURLInput( { value: 'hello' } );

			await waitFor( () =>
				expect( fetchLinkSuggestions ).toHaveBeenCalledTimes( 1 )
			);

			await user.type( input, ' world' );
			await waitFor( () =>
				expect( fetchLinkSuggestions ).toHaveBeenCalledTimes( 2 )
			);

			resolveStaleRequest( [
				{
					id: 3,
					title: 'Stale result',
					type: 'post',
					url: 'https://example.com/stale',
				},
			] );

			expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
			expect(
				screen.queryByRole( 'option', { name: 'Stale result' } )
			).not.toBeInTheDocument();
		} );

		it( 'should fall back to the fetch handler from the block editor settings', async () => {
			dispatch( blockEditorStore ).updateSettings( {
				__experimentalFetchLinkSuggestions: fetchLinkSuggestions,
			} );

			try {
				const user = userEvent.setup();
				render( <ControlledURLInput /> );

				await user.type( screen.getByRole( 'combobox' ), 'hello' );

				expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
				expect( fetchLinkSuggestions ).toHaveBeenCalledWith( 'hello', {
					isInitialSuggestions: false,
				} );
			} finally {
				dispatch( blockEditorStore ).updateSettings( {
					__experimentalFetchLinkSuggestions: undefined,
				} );
			}
		} );
	} );

	describe( 'IME composition', () => {
		it( 'should not fetch suggestions for the intermediate values of an IME composition', async () => {
			const { input } = renderURLInput();

			fireEvent.compositionStart( input );
			fireEvent.change( input, { target: { value: 'ほ' } } );
			fireEvent.change( input, { target: { value: 'ほん' } } );
			fireEvent.change( input, { target: { value: 'ほんだ' } } );
			await flushDebounce();

			expect( fetchLinkSuggestions ).not.toHaveBeenCalled();
			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should not fetch suggestions for a value superseded by an IME composition', async () => {
			const { user, input } = renderURLInput();

			await user.type( input, 'ab' );
			fireEvent.compositionStart( input );
			fireEvent.change( input, { target: { value: 'abほ' } } );
			await flushDebounce();

			expect( fetchLinkSuggestions ).not.toHaveBeenCalled();
		} );

		// Firefox reports the confirmed value of a composition after
		// `compositionend`, Chrome and Safari before it.
		// See: https://bugzilla.mozilla.org/show_bug.cgi?id=1305387
		it.each( [ 'before', 'after' ] )(
			'should fetch suggestions for a composed value reported %s the composition ends',
			async ( order ) => {
				const { input } = renderURLInput();

				fireEvent.compositionStart( input );
				fireEvent.change( input, { target: { value: 'ほんだ' } } );
				// Compositions outlast the debounce, so the confirmed value is
				// the only one a request is made for.
				await flushDebounce();

				if ( order === 'before' ) {
					fireEvent.change( input, { target: { value: 'ホンダ' } } );
					fireEvent.compositionEnd( input );
				} else {
					fireEvent.compositionEnd( input );
					fireEvent.change( input, { target: { value: 'ホンダ' } } );
				}

				expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
				expect( fetchLinkSuggestions ).toHaveBeenCalledTimes( 1 );
				expect( fetchLinkSuggestions ).toHaveBeenCalledWith( 'ホンダ', {
					isInitialSuggestions: false,
				} );
			}
		);
	} );

	describe( 'announcements', () => {
		it( 'should announce the number of results', async () => {
			await renderWithSuggestions();

			await waitFor( () =>
				expect( speak ).toHaveBeenCalledWith(
					'2 results found, use up and down arrow keys to navigate.',
					'assertive'
				)
			);
		} );

		it( 'should announce when there are no results', async () => {
			fetchLinkSuggestions.mockResolvedValue( [] );

			renderURLInput( { value: 'hello' } );

			await waitFor( () =>
				expect( speak ).toHaveBeenCalledWith(
					'No results.',
					'assertive'
				)
			);
		} );
	} );

	describe( 'keyboard interaction', () => {
		it( 'should move the active suggestion with the down arrow key', async () => {
			const { input } = await renderWithSuggestions();

			expect( input ).not.toHaveAttribute( 'aria-activedescendant' );

			fireEvent.keyDown( input, KEY_EVENTS.down );

			const [ firstOption, secondOption ] =
				screen.getAllByRole( 'option' );

			expect( input ).toHaveAttribute(
				'aria-activedescendant',
				firstOption.id
			);
			expect( firstOption ).toHaveAttribute( 'aria-selected', 'true' );

			fireEvent.keyDown( input, KEY_EVENTS.down );

			expect( input ).toHaveAttribute(
				'aria-activedescendant',
				secondOption.id
			);

			// Wraps back around to the first suggestion.
			fireEvent.keyDown( input, KEY_EVENTS.down );

			expect( input ).toHaveAttribute(
				'aria-activedescendant',
				firstOption.id
			);
		} );

		it( 'should move the active suggestion with the up arrow key', async () => {
			const { input } = await renderWithSuggestions();

			// Wraps around to the last suggestion.
			fireEvent.keyDown( input, KEY_EVENTS.up );

			const [ firstOption, secondOption ] =
				screen.getAllByRole( 'option' );

			expect( input ).toHaveAttribute(
				'aria-activedescendant',
				secondOption.id
			);

			fireEvent.keyDown( input, KEY_EVENTS.up );

			expect( input ).toHaveAttribute(
				'aria-activedescendant',
				firstOption.id
			);

			fireEvent.keyDown( input, KEY_EVENTS.up );

			expect( input ).toHaveAttribute(
				'aria-activedescendant',
				secondOption.id
			);
		} );

		it( 'should select and submit the active suggestion when pressing Enter', async () => {
			const onSubmit = jest.fn();
			const { input, onChange } = await renderWithSuggestions( {
				onSubmit,
			} );

			fireEvent.keyDown( input, KEY_EVENTS.down );
			fireEvent.keyDown( input, KEY_EVENTS.enter );

			expect( onChange ).toHaveBeenLastCalledWith(
				SUGGESTIONS[ 0 ].url,
				SUGGESTIONS[ 0 ]
			);
			expect( onSubmit ).toHaveBeenCalledWith(
				SUGGESTIONS[ 0 ],
				expect.anything()
			);
			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should submit without a suggestion when pressing Enter with no active suggestion', async () => {
			const onSubmit = jest.fn();
			const { input } = await renderWithSuggestions( { onSubmit } );

			fireEvent.keyDown( input, KEY_EVENTS.enter );

			expect( onSubmit ).toHaveBeenCalledWith( null, expect.anything() );
		} );

		it( 'should submit without a suggestion when pressing Enter and there are no suggestions', async () => {
			const onSubmit = jest.fn();
			const onKeyDown = jest.fn();
			const { input } = renderURLInput( {
				value: 'hello',
				disableSuggestions: true,
				onSubmit,
				onKeyDown,
			} );

			fireEvent.keyDown( input, KEY_EVENTS.enter );

			expect( onSubmit ).toHaveBeenCalledWith( null, expect.anything() );
			expect( onKeyDown ).toHaveBeenCalled();
		} );

		it( 'should select and announce the active suggestion when pressing Tab', async () => {
			const { input, onChange } = await renderWithSuggestions();

			fireEvent.keyDown( input, KEY_EVENTS.down );
			fireEvent.keyDown( input, KEY_EVENTS.tab );

			expect( onChange ).toHaveBeenLastCalledWith(
				SUGGESTIONS[ 0 ].url,
				SUGGESTIONS[ 0 ]
			);
			expect( speak ).toHaveBeenCalledWith( 'Link selected.' );
		} );

		// Works around Firefox on Windows not moving the caret with the arrow
		// keys. See https://github.com/WordPress/gutenberg/issues/5693.
		it( 'should move the caret to either end of the input when there are no suggestions', async () => {
			const { user, input } = renderURLInput( {
				disableSuggestions: true,
			} );

			await user.type( input, 'hello' );
			expect( input.selectionStart ).toBe( 5 );

			fireEvent.keyDown( input, KEY_EVENTS.up );
			expect( input.selectionStart ).toBe( 0 );

			fireEvent.keyDown( input, KEY_EVENTS.down );
			expect( input.selectionStart ).toBe( 5 );

			// A selection reaching an end is collapsed to it first.
			input.setSelectionRange( 0, 5 );
			fireEvent.keyDown( input, KEY_EVENTS.up );
			expect( input.selectionEnd ).toBe( 0 );
		} );

		it( 'should leave a selection being extended with the shift key alone', async () => {
			const { user, input } = renderURLInput( {
				disableSuggestions: true,
			} );

			await user.type( input, 'hello' );
			input.setSelectionRange( 0, 5 );

			fireEvent.keyDown( input, {
				...KEY_EVENTS.up,
				shiftKey: true,
			} );

			expect( input.selectionStart ).toBe( 0 );
			expect( input.selectionEnd ).toBe( 5 );
		} );
	} );

	describe( 'suggestion selection', () => {
		it( 'should select a suggestion on click and return focus to the input', async () => {
			const { user, input, onChange } = await renderWithSuggestions();

			await user.click(
				screen.getByRole( 'option', { name: 'Sample page' } )
			);

			expect( onChange ).toHaveBeenLastCalledWith(
				SUGGESTIONS[ 1 ].url,
				SUGGESTIONS[ 1 ]
			);
			expect( input ).toHaveFocus();
			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'custom rendering', () => {
		it( 'should render the control via `__experimentalRenderControl`', () => {
			const renderControl = jest
				.fn()
				.mockReturnValue( <div>Custom control</div> );

			render(
				<URLInput
					value=""
					onChange={ () => {} }
					__experimentalRenderControl={ renderControl }
				/>
			);

			expect( screen.getByText( 'Custom control' ) ).toBeVisible();
			expect( renderControl ).toHaveBeenCalledWith(
				expect.objectContaining( { label: null } ),
				expect.objectContaining( { role: 'combobox', value: '' } ),
				false
			);
		} );

		it( 'should render suggestions via `__experimentalRenderSuggestions`', async () => {
			const renderSuggestions = jest.fn( ( { suggestions } ) => (
				<ul>
					{ suggestions.map( ( suggestion ) => (
						<li key={ suggestion.id }>{ suggestion.title }</li>
					) ) }
				</ul>
			) );

			renderURLInput( {
				value: 'hello',
				__experimentalRenderSuggestions: renderSuggestions,
			} );

			expect(
				await screen.findByText( 'Hello world' )
			).toBeInTheDocument();
			expect( renderSuggestions ).toHaveBeenLastCalledWith(
				expect.objectContaining( {
					suggestions: SUGGESTIONS,
					selectedSuggestion: null,
					isLoading: false,
					isInitialSuggestions: false,
					currentInputValue: 'hello',
				} )
			);
		} );
	} );

	describe( 'validation', () => {
		it( 'should not remount the input when a custom validity is cleared', async () => {
			const user = userEvent.setup();
			const props = {
				label: 'Link',
				value: 'hello',
				onChange: () => {},
			};

			const { rerender } = render(
				<URLInput
					{ ...props }
					customValidity={ {
						type: 'invalid',
						message: 'Invalid URL.',
					} }
				/>
			);

			const input = screen.getByRole( 'combobox' );
			await user.click( input );

			rerender( <URLInput { ...props } customValidity={ undefined } /> );

			expect( screen.getByRole( 'combobox' ) ).toBe( input );
			expect( input ).toHaveFocus();
		} );
	} );
} );
