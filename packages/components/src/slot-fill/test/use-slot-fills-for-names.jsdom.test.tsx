import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Fill, Provider } from '../';
import { useSlotFillsForNames } from '../bubbles-virtually/use-slot-fills';
import type { SlotKey } from '../types';

function TestHarness( {
	names,
	onResult,
}: {
	names: string[];
	onResult: ( result: Set< SlotKey > ) => void;
} ) {
	onResult( useSlotFillsForNames( names ) );
	return null;
}

describe( 'useSlotFillsForNames', () => {
	it( 'returns an empty set when none of the watched names have a fill', () => {
		let latestResult: Set< SlotKey > = new Set();

		render(
			<Provider>
				<TestHarness
					names={ [ 'a', 'b' ] }
					onResult={ ( result ) => {
						latestResult = result;
					} }
				/>
			</Provider>
		);

		expect( latestResult.size ).toBe( 0 );
	} );

	it( 'includes a name once it has a fill, and updates live', () => {
		let latestResult: Set< SlotKey > = new Set();
		const harness = (
			<Provider>
				<TestHarness
					names={ [ 'a', 'b' ] }
					onResult={ ( result ) => {
						latestResult = result;
					} }
				/>
			</Provider>
		);

		const { rerender } = render( harness );
		expect( latestResult.has( 'a' ) ).toBe( false );

		rerender(
			<Provider>
				<TestHarness
					names={ [ 'a', 'b' ] }
					onResult={ ( result ) => {
						latestResult = result;
					} }
				/>
				<Fill name="a">content</Fill>
			</Provider>
		);

		expect( latestResult.has( 'a' ) ).toBe( true );
		expect( latestResult.has( 'b' ) ).toBe( false );
	} );

	it( 'only reports the watched names, ignoring fills for other names', () => {
		let latestResult: Set< SlotKey > = new Set();
		const { rerender } = render(
			<Provider>
				<TestHarness
					names={ [ 'a' ] }
					onResult={ ( result ) => {
						latestResult = result;
					} }
				/>
			</Provider>
		);

		rerender(
			<Provider>
				<TestHarness
					names={ [ 'a' ] }
					onResult={ ( result ) => {
						latestResult = result;
					} }
				/>
				<Fill name="unwatched">content</Fill>
			</Provider>
		);

		expect( latestResult.size ).toBe( 0 );
	} );
} );
