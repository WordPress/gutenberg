import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SuggestionSummary, { summarizeOperations } from '../suggestion-summary';
import type { SuggestionOperation } from '../operations';

const OLD_TEXT =
	'This original paragraph is long enough that the replaced side of the summary has to be cut short.';
const NEW_TEXT =
	'This proposed replacement is far longer than the sixty characters a Replace line shows on each side of the arrow.';

const typeOver = [
	{
		type: 'inline-suggestion',
		suggestionType: 'replace',
		attribute: 'content',
		text: NEW_TEXT,
		deletedText: OLD_TEXT,
	},
] as unknown as SuggestionOperation[];

describe( 'summarizeOperations truncate option', () => {
	it( 'returns the same lines with uncapped quotes', () => {
		const capped = summarizeOperations( typeOver );
		const full = summarizeOperations( typeOver, { truncate: false } );
		expect( full ).toHaveLength( capped.length );
		expect( full[ 0 ].label ).toBe( capped[ 0 ].label );
		expect( capped[ 0 ].value ).not.toContain( NEW_TEXT );
		expect( full[ 0 ].value ).toBe( `“${ OLD_TEXT }” → “${ NEW_TEXT }”` );
	} );
} );

describe( 'SuggestionSummary', () => {
	it( 'shows no toggle when nothing was cut', () => {
		render(
			<SuggestionSummary
				operations={
					[
						{
							type: 'inline-suggestion',
							suggestionType: 'replace',
							attribute: 'content',
							text: 'planet',
							deletedText: 'world',
						},
					] as unknown as SuggestionOperation[]
				}
			/>
		);
		expect( screen.getByText( '“world” → “planet”' ) ).toBeVisible();
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	it( 'expands and collapses a truncated summary, keeping focus on the toggle', async () => {
		const user = userEvent.setup();
		render( <SuggestionSummary operations={ typeOver } /> );

		const fullValue = `“${ OLD_TEXT }” → “${ NEW_TEXT }”`;
		expect( screen.queryByText( fullValue ) ).not.toBeInTheDocument();

		const toggle = screen.getByRole( 'button', { name: 'Show more' } );
		expect( toggle ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( toggle ).toHaveAttribute( 'aria-controls' );

		await user.click( toggle );
		expect( screen.getByText( fullValue ) ).toBeVisible();
		const collapse = screen.getByRole( 'button', { name: 'Show less' } );
		expect( collapse ).toHaveAttribute( 'aria-expanded', 'true' );
		expect( collapse ).toHaveFocus();

		await user.keyboard( '{Enter}' );
		expect( screen.queryByText( fullValue ) ).not.toBeInTheDocument();
		expect(
			screen.getByRole( 'button', { name: 'Show more' } )
		).toHaveFocus();
	} );
} );
