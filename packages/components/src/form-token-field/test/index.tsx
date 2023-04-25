/* eslint jest/expect-expect: ["warn", { "assertFunctionNames": ["expect", "expectTokensToBeInTheDocument", "expectTokensNotToBeInTheDocument", "expectVisibleSuggestionsToBe", "expectEscapedProperly"] }] */

/**
 * External dependencies
 */
import {
	render,
	screen,
	within,
	getDefaultNormalizer,
	waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FormTokenField from '../';

const FormTokenFieldWithState = ( {
	onChange,
	value,
	initialValue = [],
	...props
}: ComponentProps< typeof FormTokenField > & {
	initialValue?: ComponentProps< typeof FormTokenField >[ 'value' ];
} ) => {
	const [ selectedValue, setSelectedValue ] =
		useState< ComponentProps< typeof FormTokenField >[ 'value' ] >(
			initialValue
		);

	return (
		<FormTokenField
			{ ...props }
			value={ selectedValue }
			onChange={ ( tokens ) => {
				setSelectedValue( tokens );
				onChange?.( tokens );
			} }
			__nextHasNoMarginBottom
		/>
	);
};

const expectTokensToBeInTheDocument = ( tokensText: string[] ) => {
	tokensText.forEach( ( tokenText, tokenIndex, tokensArray ) => {
		// Each token has 2 tags rendered in the DOM:
		// - one with the format "takenName (X of Y)", which is visibly hidden,
		//   and is used for assistive technology;
		// - one with the format "tokenName", which is visible but hidden to
		//   assistive technology.
		const assistiveTechnologyToken = screen.getByText(
			`${ tokenText } (${ tokenIndex + 1 } of ${ tokensArray.length })`,
			{
				normalizer: getDefaultNormalizer( {
					collapseWhitespace: false,
					trim: false,
				} ),
			}
		);
		// The "exact" flag is necessary in order no to match the element
		//  used for assistive technology.
		const visibleToken = screen.getByText( tokenText, {
			exact: true,
			normalizer: getDefaultNormalizer( {
				collapseWhitespace: false,
				trim: false,
			} ),
		} );

		expect( assistiveTechnologyToken ).toBeInTheDocument();
		expect( visibleToken ).toBeVisible();
		expect( visibleToken ).toHaveAttribute( 'aria-hidden', 'true' );
	} );
};
const expectTokensNotToBeInTheDocument = ( tokensText: string[] ) => {
	tokensText.forEach( ( tokenText ) =>
		expect( screen.queryByText( tokenText ) ).not.toBeInTheDocument()
	);
};

const expectEscapedProperly = ( tokenHtml: string ) => {
	screen.getByText( ( _, node: Element | null ) => {
		if ( node === null ) {
			return false;
		}

		// This is hacky, but it's a way we can check exactly the output HTML
		return node.innerHTML === tokenHtml;
	} );
};

const expectVisibleSuggestionsToBe = (
	listElement: HTMLElement,
	suggestionsText: string[]
) => {
	const allVisibleOptions = within( listElement ).queryAllByRole( 'option' );

	expect( allVisibleOptions ).toHaveLength( suggestionsText.length );

	allVisibleOptions.forEach( ( matchedOption, index ) => {
		expect( matchedOption ).toHaveAccessibleName(
			suggestionsText[ index ]
		);
	} );
};

function unescapeAndFormatSpaces( str: string ) {
	const nbsp = String.fromCharCode( 160 );
	const escaped = new DOMParser().parseFromString( str, 'text/html' );
	return escaped.documentElement.textContent?.replace( / /g, nbsp ) ?? '';
}

describe( 'FormTokenField', () => {
	describe( 'basic usage', () => {
		it( "should add tokens with the input's value when pressing the enter key", async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			render( <FormTokenFieldWithState onChange={ onChangeSpy } /> );

			const input = screen.getByRole( 'combobox' );

			// Add 'apple' token by typing it and pressing enter to tokenize it.
			await user.type( input, 'apple[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [ 'apple' ] );
			expectTokensToBeInTheDocument( [ 'apple' ] );

			// Add 'pear' token by typing it and pressing enter to tokenize it.
			await user.type( input, 'pear[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 2 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( [
				'apple',
				'pear',
			] );
			expectTokensToBeInTheDocument( [ 'apple', 'pear' ] );
		} );

		it( "should add a token with the input's value when pressing the comma key", async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			render( <FormTokenFieldWithState onChange={ onChangeSpy } /> );

			const input = screen.getByRole( 'combobox' );

			// Add 'orange' token by typing it and pressing enter to tokenize it.
			await user.type( input, 'orange,' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [ 'orange' ] );
			expectTokensToBeInTheDocument( [ 'orange' ] );
		} );

		it( 'should add a token with the input value when pressing the space key and the `tokenizeOnSpace` prop is `true`', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			const { rerender } = render(
				<FormTokenFieldWithState onChange={ onChangeSpy } />
			);

			const input = screen.getByRole( 'combobox' );

			// Add 'dragon fruit' token by typing it and pressing enter to tokenize it.
			await user.type( input, 'dragon fruit[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [ 'dragon fruit' ] );
			expectTokensToBeInTheDocument( [ 'dragon fruit' ] );

			rerender(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					tokenizeOnSpace
				/>
			);

			// Add 'dragon fruit' token by typing it and pressing enter to tokenize it,
			// this time two separate tokens should be added
			await user.type( input, 'dragon fruit[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 3 );
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 2, [
				'dragon fruit',
				'dragon',
			] );
			expect( onChangeSpy ).toHaveBeenNthCalledWith( 3, [
				'dragon fruit',
				'dragon',
				'fruit',
			] );
			expectTokensToBeInTheDocument( [
				'dragon fruit',
				'dragon',
				'fruit',
			] );
		} );

		it( "should not add a token with the input's value when pressing the tab key", async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			render( <FormTokenFieldWithState onChange={ onChangeSpy } /> );

			const input = screen.getByRole( 'combobox' );

			// Add 'orange' token by typing it and pressing enter to tokenize it.
			await user.type( input, 'grapefruit' );
			await user.tab();
			expect( onChangeSpy ).toHaveBeenCalledTimes( 0 );
			expectTokensNotToBeInTheDocument( [ 'grapefruit' ] );
		} );

		it( 'should remove the last token when pressing the backspace key', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			render(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					initialValue={ [ 'banana', 'mango' ] }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Press backspace to remove the last token ("mango")
			await user.type( input, '[Backspace]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( [ 'banana' ] );
			expectTokensToBeInTheDocument( [ 'banana' ] );
			expectTokensNotToBeInTheDocument( [ 'mango' ] );

			// Press backspace to remove the last token ("banana")
			await user.type( input, '[Backspace]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 2 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( [] );
			expectTokensNotToBeInTheDocument( [ 'banana', 'mango' ] );
		} );

		it( 'should remove a token when clicking the token\'s "remove" button', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			render(
				<FormTokenFieldWithState
					initialValue={ [ 'lemon', 'bergamot' ] }
					onChange={ onChangeSpy }
				/>
			);

			expectTokensToBeInTheDocument( [ 'lemon', 'bergamot' ] );

			// There should be 2 "remove item" buttons, one per token
			expect(
				screen.getAllByRole( 'button', { name: 'Remove item' } )
			).toHaveLength( 2 );

			// Click the "X" button for the "lemon" token (the first one)
			await user.click(
				screen.getAllByRole( 'button', { name: 'Remove item' } )[ 0 ]
			);
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( [ 'bergamot' ] );
			expectTokensToBeInTheDocument( [ 'bergamot' ] );
			expectTokensNotToBeInTheDocument( [ 'lemon' ] );

			// There should be 1 "remove item" button for the "bergamot" token
			expect(
				screen.getByRole( 'button', { name: 'Remove item' } )
			).toBeInTheDocument();

			// Click the "X" button for the "bergamot" token (the only one)
			await user.click(
				screen.getAllByRole( 'button', { name: 'Remove item' } )[ 0 ]
			);
			expect( onChangeSpy ).toHaveBeenCalledTimes( 2 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( [] );
			expectTokensNotToBeInTheDocument( [ 'lemon', 'bergamot' ] );
		} );

		it( 'should remove a token when by focusing on the token\'s "remove" button and pressing space bar', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			render(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					initialValue={ [ 'persimmon', 'plum' ] }
				/>
			);

			const input = screen.getByRole( 'combobox' );
			await user.click( input );

			// Currently the focus in on the input. Pressing shift+tab twice should
			// move focus on the "remove item" button of the first token ("persimmon")
			await user.tab( { shift: true } );
			await user.tab( { shift: true } );

			expect(
				screen.getAllByRole( 'button', { name: 'Remove item' } )
			).toHaveLength( 2 );
			expect(
				screen.getAllByRole( 'button', { name: 'Remove item' } )[ 0 ]
			).toHaveFocus();

			// Pressing the "space" key on the button should remove the "persimmon" item
			await user.keyboard( '[Space]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( [ 'plum' ] );
			expectTokensToBeInTheDocument( [ 'plum' ] );
			expectTokensNotToBeInTheDocument( [ 'persimmon' ] );
		} );

		it( 'should not add a new token if a token with the same value already exists', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			render(
				<FormTokenFieldWithState
					initialValue={ [ 'papaya' ] }
					onChange={ onChangeSpy }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Add 'guava' token by typing it and pressing enter to tokenize it.
			await user.type( input, 'guava[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [ 'papaya', 'guava' ] );
			expectTokensToBeInTheDocument( [ 'papaya', 'guava' ] );

			// Try to add a 'papaya' token by typing it and pressing enter to tokenize it,
			// but the token won't be added because it already exists.
			await user.type( input, 'papaya[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expectTokensToBeInTheDocument( [ 'papaya', 'guava' ] );
		} );

		it( 'should not add a new token if the text input is blank', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			render(
				<FormTokenFieldWithState
					initialValue={ [ 'melon' ] }
					onChange={ onChangeSpy }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Press enter on an empty input, no token gets added
			await user.type( input, '[Enter]' );
			expect( onChangeSpy ).not.toHaveBeenCalled();
			expectTokensToBeInTheDocument( [ 'melon' ] );
		} );

		it( 'should allow moving the cursor through the tokens when pressing the arrow keys, and should remove the token in front of the cursor when pressing the delete key', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			render(
				<FormTokenFieldWithState
					initialValue={ [ 'kiwi', 'peach', 'nectarine', 'coconut' ] }
					onChange={ onChangeSpy }
				/>
			);

			expectTokensToBeInTheDocument( [
				'kiwi',
				'peach',
				'nectarine',
				'coconut',
			] );

			const input = screen.getByRole( 'combobox' );

			// Press "delete" to delete the token in front of the cursor, but since
			// there's no token in front of the cursor, nothing happens
			await user.type( input, '[Delete]' );

			// Pressing the right arrow doesn't move the cursor because there are no
			// tokens in front of it, and therefore pressing "delete" yields the same
			// result as before — no tokens are deleted.
			await user.type( input, '[ArrowRight][Delete]' );

			// Proof that so far, all keyboard interactions didn't delete any tokens.
			expect( onChangeSpy ).not.toHaveBeenCalled();
			expectTokensToBeInTheDocument( [
				'kiwi',
				'peach',
				'nectarine',
				'coconut',
			] );

			// Press the left arrow 4 times, moving cursor between the "kiwi" and
			// "peach" tokens. Pressing the "delete" key will delete the "peach"
			// token, since it's in front of the cursor.
			await user.type(
				input,
				'[ArrowLeft][ArrowLeft][ArrowLeft][ArrowLeft][Delete]'
			);
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [
				'peach',
				'nectarine',
				'coconut',
			] );
			expectTokensToBeInTheDocument( [
				'peach',
				'nectarine',
				'coconut',
			] );
			expectTokensNotToBeInTheDocument( [ 'kiwi' ] );

			// Press backspace to delete the token before the cursor, but since
			// there's no token before the cursor, nothing happens
			await user.type( input, '[Backspace]' );

			// Pressing the left arrow doesn't move the cursor because there are no
			// tokens before it, and therefore pressing backspace yields the same
			// result as before — no tokens are deleted.
			await user.type( input, '[ArrowLeft][Backspace]' );

			// Proof that pressing backspace hasn't caused any further token deletion.
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );

			// Press the right arrow, moving cursor between the "kiwi" and
			// "nectarine" tokens. Pressing the "delete" key will delete the "nectarine"
			// token, since it's in front of the cursor.
			await user.type( input, '[ArrowRight][Delete]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 2 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [
				'peach',
				'coconut',
			] );
			expectTokensToBeInTheDocument( [ 'peach', 'coconut' ] );
			expectTokensNotToBeInTheDocument( [ 'kiwi', 'nectarine' ] );

			// Add 'starfruit' token while the cursor is in between the "peach" and
			// "coconut" tokens.
			await user.type( input, 'starfruit[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 3 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [
				'peach',
				// Notice that starfruit is added in between "peach" and "coconut"
				'starfruit',
				'coconut',
			] );
			expectTokensToBeInTheDocument( [
				'peach',
				'starfruit',
				'coconut',
			] );
		} );

		it( "should add additional classnames passed via the `className` prop to the input element's 2nd level wrapper", () => {
			render( <FormTokenFieldWithState className="test-classname" /> );

			const input = screen.getByRole( 'combobox' );

			// This is testing implementation details, but I'm not sure there's
			// a better way.
			// eslint-disable-next-line testing-library/no-node-access
			expect( input.parentElement?.parentElement ).toHaveClass(
				'test-classname'
			);
		} );

		it( 'should label the input correctly via the `label` prop', () => {
			const { rerender } = render( <FormTokenFieldWithState /> );

			expect(
				screen.getByRole( 'combobox', { name: 'Add item' } )
			).toBeVisible();

			rerender( <FormTokenFieldWithState label="Test label" /> );

			expect(
				screen.getByRole( 'combobox', { name: 'Test label' } )
			).toBeVisible();
		} );

		it( 'should fire the `onFocus` callback when the input is focused', async () => {
			const user = userEvent.setup();

			const onFocusSpy = jest.fn();

			render( <FormTokenFieldWithState onFocus={ onFocusSpy } /> );

			const input = screen.getByRole( 'combobox' );

			await user.click( input );

			expect( onFocusSpy ).toHaveBeenCalledTimes( 1 );
			expect( onFocusSpy ).toHaveBeenCalledWith(
				expect.objectContaining( {
					type: 'focus',
					target: input,
				} )
			);

			expect( input ).toHaveFocus();
		} );

		it( "should fire the `onInputChange` callback when the input's value changes", async () => {
			const user = userEvent.setup();

			const onInputChangeSpy = jest.fn();

			render(
				<FormTokenFieldWithState onInputChange={ onInputChangeSpy } />
			);

			const input = screen.getByRole( 'combobox' );

			await user.type( input, 'strawberry[Enter]' );

			expect( onInputChangeSpy ).toHaveBeenCalledTimes(
				'strawberry'.length
			);
			expect( onInputChangeSpy ).toHaveBeenNthCalledWith(
				5,
				'strawberry'.slice( 0, 5 )
			);
		} );

		it( 'should show extra instructions when the `__experimentalShowHowTo` prop  is set to `true`', () => {
			const instructionsTokenizeSpace =
				'Separate with commas, spaces, or the Enter key.';
			const instructionsDefault =
				'Separate with commas or the Enter key.';

			// The __experimentalShowHowTo prop is `true` by default
			const { rerender } = render( <FormTokenFieldWithState /> );

			expect( screen.getByText( instructionsDefault ) ).toBeVisible();

			// The "show how to" text is used to aria-describedby the input
			expect(
				screen.getByRole( 'combobox' )
			).toHaveAccessibleDescription( instructionsDefault );

			rerender( <FormTokenFieldWithState tokenizeOnSpace /> );

			expect(
				screen.getByText( instructionsTokenizeSpace )
			).toBeVisible();

			// The "show how to" text is used to aria-describedby the input
			expect(
				screen.getByRole( 'combobox' )
			).toHaveAccessibleDescription( instructionsTokenizeSpace );

			rerender(
				<FormTokenFieldWithState
					tokenizeOnSpace
					__experimentalShowHowTo={ false }
				/>
			);

			expect(
				screen.queryByText( instructionsDefault )
			).not.toBeInTheDocument();
			expect(
				screen.queryByText( instructionsTokenizeSpace )
			).not.toBeInTheDocument();
			expect(
				screen.getByRole( 'combobox' )
			).not.toHaveAccessibleDescription();
		} );

		it( "should use the value of the `placeholder` prop as the input's placeholder only when there are no tokens", async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			render(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					placeholder="Test placeholder"
				/>
			);

			expect(
				screen.getByPlaceholderText( 'Test placeholder' )
			).toBeVisible();

			const input = screen.getByRole( 'combobox' );

			// Add 'blueberry' token. The placeholder text should not be shown anymore
			await user.type( input, 'blueberry[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [ 'blueberry' ] );
			expectTokensToBeInTheDocument( [ 'blueberry' ] );

			expect(
				screen.queryByPlaceholderText( 'Test placeholder' )
			).not.toBeInTheDocument();
		} );

		it( 'should handle accents and special characters in tokens and input value', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			render(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					initialValue={ [ 'français', 'español', '日本', 'עברית' ] }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Add 'عربى' token by typing it and pressing enter to tokenize it.
			await user.type( input, 'عربى[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [
				'français',
				'español',
				'日本',
				'עברית',
				'عربى',
			] );
			expectTokensToBeInTheDocument( [
				'français',
				'español',
				'日本',
				'עברית',
				'عربى',
			] );
		} );
	} );

	describe( 'suggestions', () => {
		it( 'should not render suggestions in its default state', () => {
			render(
				<FormTokenFieldWithState
					suggestions={ [ 'Red', 'Magenta', 'Vermilion' ] }
				/>
			);

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should render suggestions when receiving focus if the `__experimentalExpandOnFocus` prop is set to `true`', async () => {
			const user = userEvent.setup();

			const onFocusSpy = jest.fn();

			const suggestions = [ 'Cobalt', 'Blue', 'Octane' ];

			render(
				<>
					<FormTokenFieldWithState
						onFocus={ onFocusSpy }
						suggestions={ suggestions }
						__experimentalExpandOnFocus
					/>
				</>
			);

			const input = screen.getByRole( 'combobox' );

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();

			// Click the input, focusing it.
			await user.click( input );

			const suggestionList = screen.getByRole( 'listbox' );

			expect( onFocusSpy ).toHaveBeenCalledTimes( 1 );
			expect( suggestionList ).toBeVisible();

			expectVisibleSuggestionsToBe(
				screen.getByRole( 'listbox' ),
				suggestions
			);

			// Minimum length limitations don't affect the search text when the
			// `__experimentalExpandOnFocus` is `true`
			await user.keyboard( 'c' );
			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'Cobalt',
				'Octane',
			] );
		} );

		it( 'should not render suggestions if the text input is not matching any of the suggestions', async () => {
			const user = userEvent.setup();

			const suggestions = [ 'White', 'Pearl', 'Alabaster' ];

			render( <FormTokenFieldWithState suggestions={ suggestions } /> );

			const input = screen.getByRole( 'combobox' );

			// Type 'Snow' which doesn't match any of the suggestions
			await user.type( input, 'Snow' );

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should render the matching suggestions only if the text input has the minimum length', async () => {
			const user = userEvent.setup();

			const suggestions = [ 'Yellow', 'Canary', 'Gold', 'Blonde' ];

			render( <FormTokenFieldWithState suggestions={ suggestions } /> );

			const input = screen.getByRole( 'combobox' );

			// Despite 'l' matches some suggestions, the search text needs to be
			// at least 2 characters
			await user.type( input, '   l   ' );

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();

			// The trimmed search text is now 2 characters long (`lo`), which is
			// enough to show matching suggestions ('Yellow' and 'Blonde')
			await user.type( input, '[ArrowLeft][ArrowLeft][ArrowLeft]o' );

			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'Yellow',
				'Blonde',
			] );
		} );

		it( 'should not render a matching suggestion if a token with the same value has already been added', async () => {
			const user = userEvent.setup();

			const suggestions = [ 'Green', 'Emerald', 'Seaweed' ];

			render(
				<FormTokenFieldWithState
					suggestions={ suggestions }
					initialValue={ [ 'Green' ] }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Despite 'ee' matches both the "Green" and "Seaweed", "Green" won't be
			// displayed because there's already a token with the same value
			await user.type( input, 'ee' );

			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'Seaweed',
			] );
		} );

		it( 'should allow the user to use the keyboard to navigate and select suggestions (which are marked with the `aria-selected` attribute)', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			const suggestions = [
				'Pink',
				'Salmon',
				'Flamingo',
				'Carnation',
				'Neon',
			];

			render(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					suggestions={ suggestions }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Typing "on" will show the "Salmon", "Carnation" and "Neon" suggestions
			await user.type( input, 'on' );

			const suggestionList = screen.getByRole( 'listbox' );

			expectVisibleSuggestionsToBe( suggestionList, [
				'Salmon',
				'Carnation',
				'Neon',
			] );

			// Currently, none of the suggestions are selected
			expect(
				within( suggestionList ).queryByRole( 'option', {
					selected: true,
				} )
			).not.toBeInTheDocument();

			// Pressing the down arrow will select "Salmon"
			await user.keyboard( '[ArrowDown]' );

			expect(
				within( suggestionList ).getByRole( 'option', {
					selected: true,
				} )
			).toHaveAccessibleName( 'Salmon' );

			// Pressing the up arrow will select "Neon" (the selection wraps around
			// the list)
			await user.keyboard( '[ArrowUp]' );

			expect(
				within( suggestionList ).getByRole( 'option', {
					selected: true,
				} )
			).toHaveAccessibleName( 'Neon' );

			// Pressing the down arrow twice will select "Carnation" (the selection
			// wraps around the list)
			await user.keyboard( '[ArrowDown][ArrowDown]' );

			expect(
				within( suggestionList ).getByRole( 'option', {
					selected: true,
				} )
			).toHaveAccessibleName( 'Carnation' );

			// Pressing enter will add "Carnation" as a token and close the suggestion list
			await user.keyboard( '[Enter]' );

			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [ 'Carnation' ] );
			expectTokensToBeInTheDocument( [ 'Carnation' ] );

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should allow the user to use the mouse to navigate and select suggestions (which are marked with the `aria-selected` attribute)', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			const suggestions = [ 'Tiger', 'Tangerine', 'Orange' ];

			render(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					suggestions={ suggestions }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Typing "er" will show the "Tiger" and "Tangerine" suggestions
			await user.type( input, 'er' );

			const suggestionList = screen.getByRole( 'listbox' );
			expectVisibleSuggestionsToBe( suggestionList, [
				'Tiger',
				'Tangerine',
			] );

			// Currently, none of the suggestions are selected
			expect(
				within( suggestionList ).queryByRole( 'option', {
					selected: true,
				} )
			).not.toBeInTheDocument();

			const tigerOption = within( suggestionList ).getByRole( 'option', {
				name: 'Tiger',
			} );
			const tangerineOption = within( suggestionList ).getByRole(
				'option',
				{
					name: 'Tangerine',
				}
			);

			// Hovering over each option will mark it as selected (via the
			// `aria-selected` attribute)
			await user.hover( tigerOption );

			expect( tigerOption ).toHaveAttribute( 'aria-selected', 'true' );
			expect( tangerineOption ).toHaveAttribute(
				'aria-selected',
				'false'
			);

			await user.hover( tangerineOption );

			expect( tigerOption ).toHaveAttribute( 'aria-selected', 'false' );
			expect( tangerineOption ).toHaveAttribute(
				'aria-selected',
				'true'
			);

			// Clicking an option will add it as a token and close the list
			await user.click( tangerineOption );

			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [ 'Tangerine' ] );
			expectTokensToBeInTheDocument( [ 'Tangerine' ] );

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should hide the suggestion list when the Escape key is pressed', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			const suggestions = [ 'Black', 'Ash', 'Onyx', 'Ebony' ];

			render(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					suggestions={ suggestions }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Typing "ony" will show the "Onyx" and "Ebony" suggestions
			await user.type( input, 'ony' );

			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'Onyx',
				'Ebony',
			] );

			expect( screen.getByRole( 'listbox' ) ).toBeVisible();

			// Pressing the ESC key will close the suggestion list
			await user.keyboard( '[Escape]' );

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
			expect( onChangeSpy ).not.toHaveBeenCalled();
		} );

		it( 'should hide the suggestion list on an empty input', async () => {
			const user = userEvent.setup();

			const suggestions = [ 'One', 'Two', 'Three' ];

			render( <FormTokenFieldWithState suggestions={ suggestions } /> );

			const input = screen.getByRole( 'combobox' );

			await user.type( input, 'on' );

			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'One',
			] );

			expect( screen.getByRole( 'listbox' ) ).toBeVisible();

			await user.clear( input );

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should hide the suggestion list on blur and invalid input', async () => {
			const user = userEvent.setup();

			const suggestions = [ 'One', 'Two', 'Three' ];

			render(
				<FormTokenFieldWithState
					suggestions={ suggestions }
					__experimentalValidateInput={ ( token ) =>
						suggestions.includes( token )
					}
				/>
			);

			const input = screen.getByRole( 'combobox' );

			await user.type( input, 'on' );

			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'One',
			] );

			expect( screen.getByRole( 'listbox' ) ).toBeVisible();

			await user.click( document.body );

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should not hide the suggestion list on blur and valid input', async () => {
			const user = userEvent.setup();

			const suggestions = [ 'One', 'Two', 'Three' ];

			render(
				<FormTokenFieldWithState
					suggestions={ suggestions }
					__experimentalValidateInput={ ( token ) =>
						suggestions.includes( token )
					}
				/>
			);

			const input = screen.getByRole( 'combobox' );

			await user.type( input, 'One' );

			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'One',
			] );

			expect( screen.getByRole( 'listbox' ) ).toBeVisible();

			await user.click( document.body );

			expect( screen.getByRole( 'listbox' ) ).toBeVisible();
		} );

		it( 'matches the search text with the suggestions in a case-insensitive way', async () => {
			const user = userEvent.setup();

			const suggestions = [ 'Cinnamon', 'Tawny', 'Mocha' ];

			render( <FormTokenFieldWithState suggestions={ suggestions } /> );

			const input = screen.getByRole( 'combobox' );

			// Because text-matching is case-insensitive, "mo" matches both
			// "Mocha" and "Cinnamon"
			await user.type( input, 'mo' );

			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'Mocha',
				'Cinnamon',
			] );
		} );

		it( 'should show, at most, a number of suggestions equals to the value of the `maxSuggestions` prop', async () => {
			const user = userEvent.setup();

			const suggestions = [
				'Ablaze',
				'Ability',
				'Abandon',
				'Abdomen',
				'Abdicate',
				'Abortive',
				'Abundance',
				'Abashedly',
				'Abominable',
				'Absolutely',
				'Absorption',
				'Abnormality',
			];

			const { rerender } = render(
				<FormTokenFieldWithState suggestions={ suggestions } />
			);

			const input = screen.getByRole( 'combobox' );

			// Because text-matching is case-insensitive, "Ab" matches all suggestions
			await user.type( input, 'Ab' );

			// By default, `maxSuggestions` has a value of 100, which means that
			// all matching suggestions will be shown.
			expectVisibleSuggestionsToBe(
				screen.getByRole( 'listbox' ),
				suggestions
			);

			rerender(
				<FormTokenFieldWithState
					suggestions={ suggestions }
					maxSuggestions={ 3 }
				/>
			);

			// Only the first 3 suggestions are shown, as per the `maxSuggestions` prop
			expectVisibleSuggestionsToBe(
				screen.getByRole( 'listbox' ),
				suggestions.slice( 0, 3 )
			);
		} );

		it( 'should match the search text against the unescaped values of suggestions with special characters (including spaces)', async () => {
			const user = userEvent.setup();

			render(
				<FormTokenFieldWithState
					displayTransform={ unescapeAndFormatSpaces }
					suggestions={ [
						'<3',
						'Stuff & Things',
						'Tags & Stuff',
						'Tags & Stuff 2',
					] }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Should match against the escaped value
			await user.type( input, '& S' );

			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'Tags & Stuff',
				'Tags & Stuff 2',
			] );

			// Should match against the escaped value
			await user.clear( input );
			await user.type( input, 's &' );

			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'Tags & Stuff',
				'Tags & Stuff 2',
			] );

			// Should not match against the escaped value
			await user.clear( input );
			await user.type( input, 'amp' );

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();
		} );

		it( 'should re-render if suggestions change', async () => {
			const user = userEvent.setup();

			const suggestions = [ 'Aluminum', 'Silver', 'Bronze' ];

			const { rerender } = render( <FormTokenFieldWithState /> );

			// Type "sil", but there are no suggestions.
			await user.type( screen.getByRole( 'combobox' ), 'sil' );

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();

			// When suggestions change, the "sil" text is matched against the new
			// suggestions, which results in the "Silver" suggestion being shown.
			rerender( <FormTokenFieldWithState suggestions={ suggestions } /> );

			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'Silver',
			] );
		} );

		it( 'should automatically select the first matching suggestions when the `__experimentalAutoSelectFirstMatch` prop is set to `true`', async () => {
			const user = userEvent.setup();

			const suggestions = [ 'Walnut', 'Hazelnut', 'Pecan' ];

			const { rerender } = render(
				<FormTokenFieldWithState suggestions={ suggestions } />
			);

			const input = screen.getByRole( 'combobox' );

			// Type "nut", which will match "Walnut" and "Hazelnut".
			await user.type( input, 'nut' );

			const suggestionList = screen.getByRole( 'listbox' );

			expectVisibleSuggestionsToBe( suggestionList, [
				'Walnut',
				'Hazelnut',
			] );

			expect(
				within( suggestionList ).queryByRole( 'option', {
					selected: true,
				} )
			).not.toBeInTheDocument();

			rerender(
				<FormTokenFieldWithState
					__experimentalAutoSelectFirstMatch
					suggestions={ suggestions }
				/>
			);

			expect(
				within( suggestionList ).getByRole( 'option', {
					selected: true,
				} )
			).toHaveAccessibleName( 'Walnut' );
		} );

		it( 'should allow to render custom suggestion items via the `__experimentalRenderItem` prop', async () => {
			const user = userEvent.setup();

			const suggestions = [ 'Wood', 'Stone', 'Metal' ];

			render(
				<FormTokenFieldWithState
					suggestions={ suggestions }
					__experimentalRenderItem={ ( { item } ) => (
						<>Suggestion: { item }</>
					) }
				/>
			);

			// Type "woo". Matching suggestion will be "Wood"
			await user.type( screen.getByRole( 'combobox' ), 'woo' );

			// The `__experimentalRenderItem` only affects the rendered suggestion,
			// but doesn't change the underlying data `value`, nor the value
			// displayed in the added token.
			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'Suggestion: Wood',
			] );

			await user.keyboard( '[ArrowDown][Enter]' );

			expectTokensToBeInTheDocument( [ 'Wood' ] );
		} );
	} );

	describe( 'tokens as objects', () => {
		it( 'should accept tokens in their object format', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			const { rerender } = render(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					__experimentalExpandOnFocus
					initialValue={ [
						{ value: 'Italy' },
						{ value: 'Switzerland' },
					] }
				/>
			);

			expectTokensToBeInTheDocument( [ 'Italy', 'Switzerland' ] );

			const input = screen.getByRole( 'combobox' );

			await user.type( input, 'Italy[Enter]' );

			expect( onChangeSpy ).not.toHaveBeenCalled();

			rerender(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					__experimentalExpandOnFocus
					initialValue={ [
						{ value: 'Italy' },
						{ value: 'Switzerland' },
					] }
					suggestions={ [ 'Italy', 'Switzerland', 'Sweden' ] }
				/>
			);
			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'Sweden',
			] );
		} );

		it( 'should trigger mouse callbacks if the `onMouseEnter` and/or the `onMouseLeave` properties are set on a token data object', async () => {
			const user = userEvent.setup();

			const onMouseEnterSpy = jest.fn();
			const onMouseLeaveSpy = jest.fn();

			render(
				<FormTokenFieldWithState
					initialValue={ [
						{
							value: 'Germany',
							onMouseEnter: onMouseEnterSpy,
							onMouseLeave: onMouseLeaveSpy,
						},
						{ value: 'Liechtenstein' },
						{ value: 'Austria' },
					] }
				/>
			);

			// Move mouse over the 'Germany' token, then over 'Austria', then over
			// 'Liechtenstein'. The mouse-related callbacks should fire only for
			// the 'Germany' token, since they are not defined for other tokens.
			await user.hover( screen.getByText( 'Germany', { exact: true } ) );

			expect( onMouseEnterSpy ).toHaveBeenCalledTimes( 1 );
			expect( onMouseLeaveSpy ).not.toHaveBeenCalled();

			await user.hover( screen.getByText( 'Austria', { exact: true } ) );

			expect( onMouseEnterSpy ).toHaveBeenCalledTimes( 1 );
			expect( onMouseLeaveSpy ).toHaveBeenCalledTimes( 1 );

			await user.hover(
				screen.getByText( 'Liechtenstein', { exact: true } )
			);

			expect( onMouseEnterSpy ).toHaveBeenCalledTimes( 1 );
			expect( onMouseLeaveSpy ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'should add an accessible `title` to a token when specified', () => {
			render(
				<FormTokenFieldWithState
					initialValue={ [
						{ value: 'France' },
						{ value: 'Spain', title: 'España' },
					] }
				/>
			);

			expect( screen.queryByTitle( 'France' ) ).not.toBeInTheDocument();
			expect( screen.getByTitle( 'España' ) ).toBeVisible();
		} );

		it( 'should be still used to filter out duplicate suggestions', async () => {
			const user = userEvent.setup();

			render(
				<FormTokenFieldWithState
					__experimentalExpandOnFocus
					initialValue={ [
						{ value: 'Slovenia' },
						{ value: 'Spain' },
					] }
					suggestions={ [ 'Slovenia', 'Slovakia', 'Sweden' ] }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Typing `slov` will match both `Slovenia` and `Slovakia`.
			await user.type( input, 'slov' );

			// However, `Slovenia` is already selected.
			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'Slovakia',
			] );
		} );
	} );

	describe( 'saveTransform', () => {
		it( "by default, it should trim the input's value from extra white spaces before attempting to add it as a token", async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			const { rerender } = render(
				<FormTokenFieldWithState
					initialValue={ [ 'potato' ] }
					onChange={ onChangeSpy }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Press enter on an empty input, no token gets added
			await user.type( input, '[Enter]' );
			expect( onChangeSpy ).not.toHaveBeenCalled();
			expectTokensToBeInTheDocument( [ 'potato' ] );

			// Add the "carrot" token - white space gets trimmed
			await user.type( input, '  carrot   [Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [
				'potato',
				'carrot',
			] );
			expectTokensToBeInTheDocument( [ 'potato', 'carrot' ] );

			// Press enter on an input containing a duplicate token but surrounded by
			// white space, no token gets added
			await user.type( input, '  potato   [Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expectTokensToBeInTheDocument( [ 'potato', 'carrot' ] );

			// Press enter on an input containing only spaces, no token gets added
			await user.type( input, '    [Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expectTokensToBeInTheDocument( [ 'potato', 'carrot' ] );

			rerender(
				<FormTokenFieldWithState
					initialValue={ [ 'potato' ] }
					onChange={ onChangeSpy }
					saveTransform={ ( text: string ) => text }
				/>
			);

			// If a custom `saveTransform` function is passed, it will be the new
			// function's duty to trim the whitespace if necessary.
			await user.clear( input );
			await user.type( input, '  parnsnip   [Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 2 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [
				'potato',
				'carrot',
				'  parnsnip   ',
			] );
			expectTokensToBeInTheDocument( [
				'potato',
				'carrot',
				'  parnsnip   ',
			] );
		} );

		it( "should allow to modify the input's value when saving it as a token", async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			const { rerender } = render(
				<FormTokenFieldWithState
					onFocus={ onChangeSpy }
					initialValue={ [ 'small trousers', 'small shirt' ] }
				/>
			);

			expectTokensToBeInTheDocument( [
				'small trousers',
				'small shirt',
			] );

			rerender(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					initialValue={ [ 'small trousers', 'small shirt' ] }
					saveTransform={ ( tokenText: string ) =>
						tokenText.replace( /small/g, 'medium' )
					}
				/>
			);

			// The `saveTransform` prop doesn't apply to existing tokens.
			expectTokensToBeInTheDocument( [
				'small trousers',
				'small shirt',
			] );
			expectTokensNotToBeInTheDocument( [
				'medium trousers',
				'medium shirt',
			] );
			expect( onChangeSpy ).not.toHaveBeenCalled();

			const input = screen.getByRole( 'combobox' );

			// Add 'small jacket' token by typing it and pressing enter to tokenize it.
			// The saveTransform function will change its value to "medium jacket"
			// when tokenizing it, thus affecting both the onChange callback and
			// the text rendered in the document.
			await user.type( input, 'small jacket[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [
				'small trousers',
				'small shirt',
				'medium jacket',
			] );
			expectTokensToBeInTheDocument( [
				'small trousers',
				'small shirt',
				'medium jacket',
			] );
			expectTokensNotToBeInTheDocument( [
				'medium trousers',
				'medium shirt',
				'small jacket',
			] );
		} );

		it( 'is applied to the search value when matching it against the list of suggestions', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			const suggestions = [ 'Expensive food', 'Free food' ];

			render(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					suggestions={ suggestions }
					saveTransform={ ( text: string ) =>
						text.replace( /cheap/gi, 'free' )
					}
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// "cheap" matches the "Free food" option, since the `saveTransform`
			// function transform "cheap" to "free"
			await user.type( input, 'cheap' );

			// But the value shown in the suggestion is still "Cheap food"
			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'Free food',
			] );

			// Selecting the suggestion will add the transformed value as a token,
			// since the `saveTransform` function will be applied before tokenizing.
			await user.keyboard( '[ArrowDown][Enter]' );

			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( [ 'Free food' ] );
		} );
	} );

	describe( 'displayTransform', () => {
		it( 'should allow to modify the text rendered in the browser for each token', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			const { rerender } = render(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					initialValue={ [ 'dark blue', 'dark green' ] }
				/>
			);

			expectTokensToBeInTheDocument( [ 'dark blue', 'dark green' ] );

			rerender(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					initialValue={ [ 'dark blue', 'dark green' ] }
					displayTransform={ ( tokenText: string ) =>
						tokenText.replace( /dark/g, 'light' )
					}
				/>
			);

			// The `displayTransform` prop applies also to the displayed text
			// of existing tokens
			expectTokensToBeInTheDocument( [ 'light blue', 'light green' ] );
			expectTokensNotToBeInTheDocument( [ 'dark blue', 'dark green' ] );

			expect( onChangeSpy ).not.toHaveBeenCalled();

			const input = screen.getByRole( 'combobox' );

			// Add 'dark red' token by typing it and pressing enter to tokenize it.
			// The displayTransform function will change its displayed value to
			// "light red", but the onChange callback will still receive "dark red" as
			// part of the component's new value.
			await user.type( input, 'dark red[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [
				'dark blue',
				'dark green',
				'dark red',
			] );
			expectTokensToBeInTheDocument( [
				'light blue',
				'light green',
				'light red',
			] );
			expectTokensNotToBeInTheDocument( [
				'dark blue',
				'dark green',
				'dark red',
			] );
		} );

		it( "is applied to each suggestions, but doesn't influence the matching against the search value", async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			const suggestions = [ 'Hot coffee', 'Hot tea' ];

			render(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					suggestions={ suggestions }
					displayTransform={ ( text: string ) =>
						text.replace( /hot/gi, 'cold' )
					}
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// The `displayTransform` function is only applied to the value
			// rendered in the DOM, while the data behind is not modified.
			await user.type( input, 'hot' );

			expectVisibleSuggestionsToBe( screen.getByRole( 'listbox' ), [
				'cold coffee',
				'cold tea',
			] );

			await user.keyboard( '[ArrowDown][Enter]' );

			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( [ 'Hot coffee' ] );
		} );

		it( 'should allow to pass a function that renders tokens with escaped special characters correctly', async () => {
			render(
				<FormTokenFieldWithState
					initialValue={ [
						'a   b',
						'i &lt;3 tags',
						'1&amp;2&amp;3&amp;4',
					] }
					displayTransform={ unescapeAndFormatSpaces }
				/>
			);

			// This is hacky, but it's a way we can check exactly the output HTML
			[
				'a&nbsp;&nbsp;&nbsp;b',
				'i&nbsp;&lt;3&nbsp;tags',
				'1&amp;2&amp;3&amp;4',
			].forEach( ( tokenHtml ) => expectEscapedProperly( tokenHtml ) );
		} );

		it( 'should allow to pass a function that renders tokens with special characters correctly', async () => {
			// This test is not as realistic as the previous one: if a WP site
			// contains tag names with special characters, the API will always
			// return the tag names already escaped.  However, this is still
			// worth testing, so we can be sure that token values with
			// dangerous characters in them don't have these characters carried
			// through unescaped to the HTML.
			render(
				<FormTokenFieldWithState
					initialValue={ [ 'a   b', 'i <3 tags', '1&2&3&4' ] }
					displayTransform={ unescapeAndFormatSpaces }
				/>
			);

			// This is hacky, but it's a way we can check exactly the output HTML
			[
				'a&nbsp;&nbsp;&nbsp;b',
				'i&nbsp;&lt;3&nbsp;tags',
				'1&amp;2&amp;3&amp;4',
			].forEach( ( tokenHtml ) => expectEscapedProperly( tokenHtml ) );
		} );
	} );

	describe( 'validation', () => {
		it( 'should add a token only if it passes the validation set via `__experimentalValidateInput`', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();
			const startsWithCapitalLetter = ( tokenText: string ) =>
				/^[A-Z]/.test( tokenText );

			const { rerender } = render(
				<FormTokenFieldWithState onChange={ onChangeSpy } />
			);

			const input = screen.getByRole( 'combobox' );

			// Add 'cherry' token by typing it and pressing enter to tokenize it.
			await user.type( input, 'cherry[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [ 'cherry' ] );
			expectTokensToBeInTheDocument( [ 'cherry' ] );

			rerender(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					__experimentalValidateInput={ startsWithCapitalLetter }
				/>
			);

			// Add 'cranberry' token by typing it and pressing enter to tokenize it.
			// The validation function won't allow the value from being tokenized.
			// Note that the any token added before is still around, even if it
			// wouldn't pass the newly added validation — this is because the
			// validation happens when the input\'s value gets tokenized.
			await user.type( input, 'cranberry[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expectTokensToBeInTheDocument( [ 'cherry' ] );
			expectTokensNotToBeInTheDocument( [ 'cranberry' ] );

			// Retry, this time with capital letter. The value should be added.
			await user.clear( input );
			await user.type( input, 'Cranberry[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 2 );
			expectTokensToBeInTheDocument( [ 'cherry', 'Cranberry' ] );
		} );
	} );

	describe( 'maxLength', () => {
		it( 'should not allow adding new tokens beyond the value defined by the `maxLength` prop', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			render(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					initialValue={ [ 'square', 'triangle', 'circle' ] }
					maxLength={ 3 }
				/>
			);

			expectTokensToBeInTheDocument( [ 'square', 'triangle', 'circle' ] );

			const input = screen.getByRole( 'combobox' );

			// Try to add the 'hexagon' token, but because the number of tokens already
			// matches `maxLength`, the token won't be added.
			await user.type( input, 'hexagon[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 0 );
			expectTokensToBeInTheDocument( [ 'square', 'triangle', 'circle' ] );
			expectTokensNotToBeInTheDocument( [ 'hexagon' ] );

			// Delete the last token ("circle"), in order to make space for the
			// hexagon token
			await user.clear( input );
			await user.keyboard( '[Backspace]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( [
				'square',
				'triangle',
			] );
			expectTokensToBeInTheDocument( [ 'square', 'triangle' ] );
			expectTokensNotToBeInTheDocument( [ 'circle' ] );

			// Try to add the 'hexagon' token again. This time, the token will be
			// added because the current number of tokens is below the `maxLength`
			// threshold.
			await user.type( input, 'hexagon[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 2 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( [
				'square',
				'triangle',
				'hexagon',
			] );
			expectTokensToBeInTheDocument( [
				'square',
				'triangle',
				'hexagon',
			] );
		} );

		it( "should not affect the number of tokens set via the `value` prop (ie. not caused by tokenizing the user's input)", () => {
			render(
				<FormTokenFieldWithState
					initialValue={ [ 'rectangle', 'ellipse', 'pentagon' ] }
					maxLength={ 2 }
				/>
			);

			expectTokensToBeInTheDocument( [
				'rectangle',
				'ellipse',
				'pentagon',
			] );
		} );

		it( 'should not affect tokens that were added before the limit was imposed', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			const { rerender } = render(
				<FormTokenFieldWithState onChange={ onChangeSpy } />
			);

			const input = screen.getByRole( 'combobox' );

			await user.type( input, 'cube[Enter]sphere[Enter]cylinder[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 3 );
			expect( onChangeSpy ).toHaveBeenLastCalledWith( [
				'cube',
				'sphere',
				'cylinder',
			] );
			expectTokensToBeInTheDocument( [ 'cube', 'sphere', 'cylinder' ] );

			// Add a `maxLength` after some tokens have already been added.
			rerender(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					maxLength={ 1 }
				/>
			);

			// Changing `maxLength` doesn't affect existing tokens, even if their
			// number exceeds the new limit.
			expect( onChangeSpy ).toHaveBeenCalledTimes( 3 );
			expectTokensToBeInTheDocument( [ 'cube', 'sphere', 'cylinder' ] );

			// Try to add the 'pyramid' token, but because the number of tokens already
			// exceeds `maxLength`, the token won't be added.
			await user.type( input, 'pyramid[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 3 );
			expectTokensToBeInTheDocument( [ 'cube', 'sphere', 'cylinder' ] );
			expectTokensNotToBeInTheDocument( [ 'pyramid' ] );
		} );
	} );

	describe( 'disabled', () => {
		it( 'should not allow adding tokens when the `disabled` prop is `true`', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			const { rerender } = render(
				<FormTokenFieldWithState onChange={ onChangeSpy } />
			);

			const input = screen.getByRole( 'combobox' );

			// Add 'sun' token by typing it and pressing enter to tokenize it.
			await user.type( input, 'sun[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expect( onChangeSpy ).toHaveBeenCalledWith( [ 'sun' ] );
			expectTokensToBeInTheDocument( [ 'sun' ] );

			rerender(
				<FormTokenFieldWithState onChange={ onChangeSpy } disabled />
			);

			// Try to add 'moon' token. The token is not added because of the `disabled`
			// prop.
			await user.type( input, 'moon[Enter]' );
			expect( onChangeSpy ).toHaveBeenCalledTimes( 1 );
			expectTokensNotToBeInTheDocument( [ 'moon' ] );
		} );

		it( 'should not allow removing tokens when the `disable` prop is `true`', async () => {
			const user = userEvent.setup();

			const onChangeSpy = jest.fn();

			render(
				<FormTokenFieldWithState
					onChange={ onChangeSpy }
					initialValue={ [ 'sea', 'ocean' ] }
					disabled
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Try to delete the last token with the keyboard. The token won't be
			// deleted, because of the `disabled` prop.
			await user.type( input, '[Backspace]' );
			expect( onChangeSpy ).not.toHaveBeenCalled();
			expectTokensToBeInTheDocument( [ 'sea', 'ocean' ] );

			// Try to delete the last token with the mouse. The token won't be
			// deleted, because of the `disabled` prop.
			await user.click(
				screen.getAllByRole( 'button', { name: 'Remove item' } )[ 0 ]
			);
			expect( onChangeSpy ).not.toHaveBeenCalled();
			expectTokensToBeInTheDocument( [ 'sea', 'ocean' ] );
		} );
	} );

	describe( 'messages', () => {
		const defaultMessages = {
			added: 'Item added.',
			removed: 'Item removed.',
			remove: 'Remove item',
			__experimentalInvalid: 'Invalid item',
		};
		const customMessages = {
			added: 'Test message for new item.',
			removed: 'Test message for item delete.',
			remove: 'Test label for item delete button.',
			__experimentalInvalid:
				'Test message for when an item fails validation.',
		};

		it( 'should announce to assistive technology the addition of a new token', async () => {
			const user = userEvent.setup();

			render( <FormTokenFieldWithState /> );

			const input = screen.getByRole( 'combobox' );

			// Add 'cat' token, check that the aria-live region has been updated.
			await user.type( input, 'cat[Enter]' );

			expect( screen.getByText( defaultMessages.added ) ).toHaveAttribute(
				'aria-live',
				'assertive'
			);
		} );

		it( 'should announce to assistive technology the addition of a new token with a custom message', async () => {
			const user = userEvent.setup();

			render( <FormTokenFieldWithState messages={ customMessages } /> );

			const input = screen.getByRole( 'combobox' );

			// Add 'dog' token, check that the aria-live region has been updated.
			await user.type( input, 'dog[Enter]' );

			expect( screen.getByText( customMessages.added ) ).toHaveAttribute(
				'aria-live',
				'assertive'
			);
		} );

		it( 'should announce to assistive technology the removal of a token', async () => {
			const user = userEvent.setup();

			render( <FormTokenFieldWithState initialValue={ [ 'horse' ] } /> );

			const input = screen.getByRole( 'combobox' );

			// Delete "horse" token
			await user.type( input, '[Backspace]' );

			expect(
				screen.getByText( defaultMessages.removed )
			).toHaveAttribute( 'aria-live', 'assertive' );
		} );

		it( 'should announce to assistive technology the removal of a token with a custom message', async () => {
			const user = userEvent.setup();

			render(
				<FormTokenFieldWithState
					initialValue={ [ 'donkey' ] }
					messages={ customMessages }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Delete "donkey" token
			await user.type( input, '[Backspace]' );

			expect(
				screen.getByText( customMessages.removed )
			).toHaveAttribute( 'aria-live', 'assertive' );
		} );

		it( 'should announce to assistive technology the failure of a potential token to pass validation', async () => {
			const user = userEvent.setup();

			render(
				<FormTokenFieldWithState
					__experimentalValidateInput={ () => false }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Try to add "eagle" token, which won't be added because of the
			// __experimentalValidateInput prop.
			await user.type( input, 'eagle[Enter]' );

			expect(
				screen.getByText( defaultMessages.__experimentalInvalid )
			).toHaveAttribute( 'aria-live', 'assertive' );
		} );

		it( 'should announce to assistive technology the failure of a potential token to pass validation with a custom message', async () => {
			const user = userEvent.setup();

			render(
				<FormTokenFieldWithState
					__experimentalValidateInput={ () => false }
					messages={ customMessages }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// Try to add "crocodile" token, which won't be added because of the
			// __experimentalValidateInput prop.
			await user.type( input, 'crocodile[Enter]' );

			expect(
				screen.getByText( customMessages.__experimentalInvalid )
			).toHaveAttribute( 'aria-live', 'assertive' );
		} );

		it( 'should announce to assistive technology the result of the matching of the search text against the list of suggestions', async () => {
			const user = userEvent.setup();

			render(
				<FormTokenFieldWithState
					suggestions={ [ 'Donkey', 'Horse', 'Dog' ] }
				/>
			);

			const input = screen.getByRole( 'combobox' );

			// No matching suggestions.
			await user.type( input, 'cat' );

			await waitFor( () =>
				expect( screen.getByText( 'No results.' ) ).toHaveAttribute(
					'aria-live',
					'assertive'
				)
			);

			// "Donkey" and "Dog" matching
			await user.clear( input );
			await user.type( input, 'do' );

			await waitFor( () =>
				expect(
					screen.getByText(
						'2 results found, use up and down arrow keys to navigate.'
					)
				).toHaveAttribute( 'aria-live', 'assertive' )
			);

			// Only "Donkey" matches
			await user.type( input, 'nk' );

			await waitFor( () =>
				expect(
					screen.getByText(
						'1 result found, use up and down arrow keys to navigate.'
					)
				).toHaveAttribute( 'aria-live', 'assertive' )
			);
		} );

		it( 'should update the label for the "delete" button of a token', async () => {
			render(
				<FormTokenFieldWithState
					initialValue={ [ 'bear', 'panda' ] }
					messages={ customMessages }
				/>
			);

			expect(
				screen.getAllByRole( 'button', { name: customMessages.remove } )
			).toHaveLength( 2 );
		} );
	} );

	// This section is definitely testing things in a non-user centric way,
	// but I wasn't sure if there was a better way.
	describe( 'aria attributes', () => {
		it( 'should add the correct aria attributes to the input as the user interacts with it', async () => {
			const user = userEvent.setup();

			const suggestions = [ 'Pine', 'Pistachio', 'Sage' ];

			render(
				<>
					<FormTokenFieldWithState suggestions={ suggestions } />
					<button>Click me</button>
				</>
			);

			// No suggestions visible
			const input = screen.getByRole( 'combobox' );

			expect( input ).toHaveAttribute( 'autoComplete', 'off' );
			expect( input ).toHaveAttribute( 'aria-autocomplete', 'list' );
			expect( input ).toHaveAttribute( 'aria-expanded', 'false' );
			expect( input ).not.toHaveAttribute( 'aria-owns' );
			expect( input ).not.toHaveAttribute( 'aria-activedescendant' );

			// Typing "Pi" will show the "Pistachio" and "Pine" suggestions.
			await user.type( input, 'Pi' );

			const suggestionList = screen.getByRole( 'listbox' );
			expect( suggestionList ).toBeVisible();

			expect( input ).toHaveAttribute( 'aria-expanded', 'true' );
			expect( input ).toHaveAttribute( 'aria-owns', suggestionList.id );
			expect( input ).not.toHaveAttribute( 'aria-activedescendant' );

			// Select the "Pine" suggestion
			await user.click( input );
			await user.keyboard( '[ArrowDown]' );

			const pineSuggestion = within( suggestionList ).getByRole(
				'option',
				{ name: 'Pine', selected: true }
			);
			expect( input ).toHaveAttribute( 'aria-expanded', 'true' );
			expect( input ).toHaveAttribute( 'aria-owns', suggestionList.id );
			expect( input ).toHaveAttribute(
				'aria-activedescendant',
				pineSuggestion.id
			);

			// Blur the input and make sure that the `aria-activedescendant`
			// is removed
			const button = screen.getByRole( 'button', { name: 'Click me' } );

			await user.click( button );

			expect( input ).not.toHaveAttribute( 'aria-activedescendant' );

			// Focus the input again, `aria-activedescendant` should be added back.
			await user.click( input );

			expect( input ).toHaveAttribute(
				'aria-activedescendant',
				pineSuggestion.id
			);

			// Add the suggestion, which hides the list
			await user.keyboard( '[Enter]' );

			expect( screen.queryByRole( 'listbox' ) ).not.toBeInTheDocument();

			expect( input ).toHaveAttribute( 'aria-expanded', 'false' );
			expect( input ).not.toHaveAttribute( 'aria-owns' );
			expect( input ).not.toHaveAttribute( 'aria-activedescendant' );
		} );
	} );
} );
