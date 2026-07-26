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

	describe( 'rendering', () => {
		it( 'should render a combobox with a generic accessible name when no label is provided', () => {
			render( <URLInput value="" onChange={ () => {} } /> );

			const input = screen.getByRole( 'combobox', { name: 'URL' } );

			expect( input ).toBeVisible();
			expect( input ).toHaveAttribute( 'aria-expanded', 'false' );
			expect( input ).toHaveAttribute( 'aria-autocomplete', 'list' );
		} );

		it( 'should use the provided label as the accessible name', () => {
			render( <URLInput label="Link" value="" onChange={ () => {} } /> );

			expect(
				screen.getByRole( 'combobox', { name: /Link/ } )
			).toBeVisible();
		} );

		it( 'should render the provided value', () => {
			render(
				<URLInput value="https://example.com" onChange={ () => {} } />
			);

			expect( screen.getByRole( 'combobox' ) ).toHaveValue(
				'https://example.com'
			);
		} );

		it( 'should render a disabled input when `disabled` is set', () => {
			render( <URLInput value="" onChange={ () => {} } disabled /> );

			expect( screen.getByRole( 'combobox' ) ).toBeDisabled();
		} );

		it( 'should call `onChange` for each character typed', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render( <ControlledURLInput onChange={ onChange } /> );

			await user.type( screen.getByRole( 'combobox' ), 'abc' );

			expect( onChange ).toHaveBeenCalledTimes( 3 );
		} );
	} );

	describe( 'fetching suggestions', () => {
		it( 'should display suggestions for the typed value', async () => {
			const user = userEvent.setup();

			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			await user.type( screen.getByRole( 'combobox' ), 'hello' );

			expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 2 );
			expect(
				screen.getByRole( 'option', { name: 'Hello world' } )
			).toBeVisible();
			expect( fetchLinkSuggestions ).toHaveBeenCalledWith( 'hello', {
				isInitialSuggestions: false,
			} );
			expect( screen.getByRole( 'combobox' ) ).toHaveAttribute(
				'aria-expanded',
				'true'
			);
		} );

		it( 'should debounce requests while the user is typing', async () => {
			const user = userEvent.setup();

			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			await user.type( screen.getByRole( 'combobox' ), 'hello' );

			await screen.findByRole( 'listbox' );

			expect( fetchLinkSuggestions ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should not fetch suggestions for fewer than two characters', async () => {
			const user = userEvent.setup();

			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			await user.type( screen.getByRole( 'combobox' ), 'h' );
			await flushDebounce();

			expect( fetchLinkSuggestions ).not.toHaveBeenCalled();
			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should not fetch suggestions for a direct URL entry', async () => {
			const user = userEvent.setup();

			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			await user.type(
				screen.getByRole( 'combobox' ),
				'https://example.com'
			);
			await flushDebounce();

			expect( fetchLinkSuggestions ).not.toHaveBeenCalled();
		} );

		it( 'should fetch suggestions for a direct URL entry when `__experimentalHandleURLSuggestions` is set', async () => {
			const user = userEvent.setup();

			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
					__experimentalHandleURLSuggestions
				/>
			);

			await user.type(
				screen.getByRole( 'combobox' ),
				'https://example.com'
			);

			expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
			expect( fetchLinkSuggestions ).toHaveBeenCalledWith(
				'https://example.com',
				{ isInitialSuggestions: false }
			);
		} );

		it( 'should fetch initial suggestions on mount when `__experimentalShowInitialSuggestions` is set', async () => {
			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
					__experimentalShowInitialSuggestions
				/>
			);

			expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
			expect( fetchLinkSuggestions ).toHaveBeenCalledWith( '', {
				isInitialSuggestions: true,
			} );
		} );

		it( 'should fetch suggestions on mount for a value that is already present', async () => {
			render(
				<ControlledURLInput
					value="hello"
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
			expect( fetchLinkSuggestions ).toHaveBeenCalledWith( 'hello', {
				isInitialSuggestions: false,
			} );
		} );

		it( 'should not fetch initial suggestions on mount when `disableSuggestions` is set', async () => {
			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
					__experimentalShowInitialSuggestions
					disableSuggestions
				/>
			);

			await flushDebounce();

			expect( fetchLinkSuggestions ).not.toHaveBeenCalled();
			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should not fetch suggestions when `disableSuggestions` is set', async () => {
			const user = userEvent.setup();

			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
					disableSuggestions
				/>
			);

			await user.type( screen.getByRole( 'combobox' ), 'hello' );
			await flushDebounce();

			expect( fetchLinkSuggestions ).not.toHaveBeenCalled();
			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should fetch suggestions on focus when the previous search returned no results', async () => {
			const user = userEvent.setup();
			let resolveMountRequest;
			fetchLinkSuggestions
				.mockImplementationOnce(
					() =>
						new Promise( ( resolve ) => {
							resolveMountRequest = resolve;
						} )
				)
				.mockResolvedValue( SUGGESTIONS );

			render(
				<ControlledURLInput
					value="hello"
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

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

			await user.click( screen.getByRole( 'combobox' ) );

			expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
			expect( fetchLinkSuggestions ).toHaveBeenCalledTimes( 2 );
		} );

		it( 'should not fetch suggestions again on refocus when suggestions are already displayed', async () => {
			const user = userEvent.setup();

			render(
				<ControlledURLInput
					value="hello"
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			await screen.findByRole( 'listbox' );

			const input = screen.getByRole( 'combobox' );

			await user.click( input );
			await user.tab();
			await user.click( input );
			await flushDebounce();

			expect( fetchLinkSuggestions ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should hide the suggestions when the value is cleared', async () => {
			const user = userEvent.setup();

			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			await user.type( input, 'hello' );
			await screen.findByRole( 'listbox' );

			await user.clear( input );

			await waitFor( () =>
				expect(
					screen.queryByRole( 'listbox' )
				).not.toBeInTheDocument()
			);
		} );

		it( 'should display a spinner while suggestions are loading', async () => {
			const user = userEvent.setup();
			let resolveRequest;
			fetchLinkSuggestions.mockImplementation(
				() =>
					new Promise( ( resolve ) => {
						resolveRequest = resolve;
					} )
			);

			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			await user.type( screen.getByRole( 'combobox' ), 'hello' );

			await waitFor( () =>
				expect( fetchLinkSuggestions ).toHaveBeenCalled()
			);
			expect( screen.getByRole( 'presentation' ) ).toBeVisible();

			resolveRequest( SUGGESTIONS );

			await waitFor( () =>
				expect(
					screen.queryByRole( 'presentation' )
				).not.toBeInTheDocument()
			);
		} );

		it( 'should ignore the response of a superseded request', async () => {
			const user = userEvent.setup();
			const staleSuggestions = [
				{
					id: 3,
					title: 'Stale result',
					type: 'post',
					url: 'https://example.com/stale',
				},
			];
			let resolveStaleRequest;
			fetchLinkSuggestions
				.mockImplementationOnce(
					() =>
						new Promise( ( resolve ) => {
							resolveStaleRequest = resolve;
						} )
				)
				.mockResolvedValue( SUGGESTIONS );

			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			await user.type( input, 'hello' );
			await waitFor( () =>
				expect( fetchLinkSuggestions ).toHaveBeenCalledTimes( 1 )
			);

			await user.type( input, ' world' );
			await waitFor( () =>
				expect( fetchLinkSuggestions ).toHaveBeenCalledTimes( 2 )
			);

			resolveStaleRequest( staleSuggestions );

			expect( await screen.findByRole( 'listbox' ) ).toBeVisible();
			expect(
				screen.queryByRole( 'option', { name: 'Stale result' } )
			).not.toBeInTheDocument();
			expect( screen.getAllByRole( 'option' ) ).toHaveLength( 2 );
		} );

		it( 'should fall back to the fetch handler from the block editor settings', async () => {
			const user = userEvent.setup();

			dispatch( blockEditorStore ).updateSettings( {
				__experimentalFetchLinkSuggestions: fetchLinkSuggestions,
			} );

			try {
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

	describe( 'announcements', () => {
		it( 'should announce the number of results', async () => {
			const user = userEvent.setup();

			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			await user.type( screen.getByRole( 'combobox' ), 'hello' );

			await waitFor( () =>
				expect( speak ).toHaveBeenCalledWith(
					'2 results found, use up and down arrow keys to navigate.',
					'assertive'
				)
			);
		} );

		it( 'should announce when there are no results', async () => {
			const user = userEvent.setup();
			fetchLinkSuggestions.mockResolvedValue( [] );

			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			await user.type( screen.getByRole( 'combobox' ), 'hello' );

			await waitFor( () =>
				expect( speak ).toHaveBeenCalledWith(
					'No results.',
					'assertive'
				)
			);
		} );
	} );

	describe( 'keyboard interaction', () => {
		// `@wordpress/keycodes` matches on `event.keyCode`, which `userEvent`
		// does not set.
		const KEY_EVENTS = {
			up: { key: 'ArrowUp', keyCode: UP },
			down: { key: 'ArrowDown', keyCode: DOWN },
			enter: { key: 'Enter', keyCode: ENTER },
			tab: { key: 'Tab', keyCode: TAB },
		};

		async function renderWithSuggestions( props = {} ) {
			const user = userEvent.setup();
			const onChange = jest.fn();
			const fetch = jest.fn().mockResolvedValue( SUGGESTIONS );

			render(
				<ControlledURLInput
					onChange={ onChange }
					__experimentalFetchLinkSuggestions={ fetch }
					{ ...props }
				/>
			);

			const input = screen.getByRole( 'combobox' );
			await user.type( input, 'hello' );
			await screen.findByRole( 'listbox' );

			return { user, input, onChange };
		}

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
		} );

		it( 'should select the active suggestion when pressing Enter', async () => {
			const { input, onChange } = await renderWithSuggestions();

			fireEvent.keyDown( input, KEY_EVENTS.down );
			fireEvent.keyDown( input, KEY_EVENTS.enter );

			expect( onChange ).toHaveBeenLastCalledWith(
				SUGGESTIONS[ 0 ].url,
				SUGGESTIONS[ 0 ]
			);
			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should submit the active suggestion when pressing Enter', async () => {
			const onSubmit = jest.fn();
			const { input } = await renderWithSuggestions( { onSubmit } );

			fireEvent.keyDown( input, KEY_EVENTS.down );
			fireEvent.keyDown( input, KEY_EVENTS.enter );

			expect( onSubmit ).toHaveBeenCalledWith(
				SUGGESTIONS[ 0 ],
				expect.anything()
			);
		} );

		it( 'should submit without a suggestion when pressing Enter with no active suggestion', async () => {
			const onSubmit = jest.fn();
			const { input } = await renderWithSuggestions( { onSubmit } );

			fireEvent.keyDown( input, KEY_EVENTS.enter );

			expect( onSubmit ).toHaveBeenCalledWith( null, expect.anything() );
		} );

		it( 'should submit without a suggestion when pressing Enter and there are no suggestions', async () => {
			const user = userEvent.setup();
			const onSubmit = jest.fn();

			render(
				<ControlledURLInput
					onSubmit={ onSubmit }
					disableSuggestions
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			const input = screen.getByRole( 'combobox' );
			await user.type( input, 'hello' );
			fireEvent.keyDown( input, KEY_EVENTS.enter );

			expect( onSubmit ).toHaveBeenCalledWith( null, expect.anything() );
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

		it( 'should move the caret to the start of the input when pressing the up arrow key with no suggestions', async () => {
			const user = userEvent.setup();

			render(
				<ControlledURLInput
					disableSuggestions
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			const input = screen.getByRole( 'combobox' );
			await user.type( input, 'hello' );

			expect( input.selectionStart ).toBe( 5 );

			fireEvent.keyDown( input, KEY_EVENTS.up );

			expect( input.selectionStart ).toBe( 0 );
		} );

		it( 'should move the caret to the end of the input when pressing the down arrow key with no suggestions', async () => {
			const user = userEvent.setup();

			render(
				<ControlledURLInput
					disableSuggestions
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			const input = screen.getByRole( 'combobox' );
			await user.type( input, 'hello' );
			input.setSelectionRange( 0, 0 );

			fireEvent.keyDown( input, KEY_EVENTS.down );

			expect( input.selectionStart ).toBe( 5 );
		} );

		it( 'should call the `onKeyDown` prop', async () => {
			const user = userEvent.setup();
			const onKeyDown = jest.fn();

			render(
				<ControlledURLInput
					onKeyDown={ onKeyDown }
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			await user.type( screen.getByRole( 'combobox' ), 'a' );

			expect( onKeyDown ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'suggestion selection', () => {
		it( 'should select a suggestion on click and return focus to the input', async () => {
			const user = userEvent.setup();
			const onChange = jest.fn();

			render(
				<ControlledURLInput
					onChange={ onChange }
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
				/>
			);

			const input = screen.getByRole( 'combobox' );
			await user.type( input, 'hello' );
			await screen.findByRole( 'listbox' );

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
				expect.objectContaining( {
					className: expect.stringContaining(
						'block-editor-url-input'
					),
				} ),
				expect.objectContaining( { role: 'combobox', value: '' } ),
				false
			);
		} );

		it( 'should render suggestions via `__experimentalRenderSuggestions`', async () => {
			const user = userEvent.setup();
			const renderSuggestions = jest.fn( ( { suggestions } ) => (
				<ul>
					{ suggestions.map( ( suggestion ) => (
						<li key={ suggestion.id }>{ suggestion.title }</li>
					) ) }
				</ul>
			) );

			render(
				<ControlledURLInput
					__experimentalFetchLinkSuggestions={ fetchLinkSuggestions }
					__experimentalRenderSuggestions={ renderSuggestions }
				/>
			);

			await user.type( screen.getByRole( 'combobox' ), 'hello' );

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
					handleSuggestionClick: expect.any( Function ),
					suggestionsListProps: expect.objectContaining( {
						role: 'listbox',
					} ),
					buildSuggestionItemProps: expect.any( Function ),
				} )
			);
		} );
	} );

	describe( 'validation', () => {
		it( 'should display a custom validity message once the field has been touched', async () => {
			const user = userEvent.setup();

			render(
				<URLInput
					label="Link"
					value="hello"
					onChange={ () => {} }
					customValidity={ {
						type: 'invalid',
						message: 'Invalid URL.',
					} }
				/>
			);

			expect(
				screen.queryByText( 'Invalid URL.' )
			).not.toBeInTheDocument();

			await user.click( screen.getByRole( 'combobox' ) );
			await user.tab();

			expect(
				await screen.findByText( 'Invalid URL.' )
			).toBeInTheDocument();
		} );

		it( 'should not remount the input when a custom validity is cleared', async () => {
			const user = userEvent.setup();

			const { rerender } = render(
				<URLInput
					label="Link"
					value="hello"
					onChange={ () => {} }
					customValidity={ {
						type: 'invalid',
						message: 'Invalid URL.',
					} }
				/>
			);

			const input = screen.getByRole( 'combobox' );
			await user.click( input );

			rerender(
				<URLInput
					label="Link"
					value="hello"
					onChange={ () => {} }
					customValidity={ undefined }
				/>
			);

			expect( screen.getByRole( 'combobox' ) ).toBe( input );
			expect( input ).toHaveFocus();
		} );
	} );
} );
