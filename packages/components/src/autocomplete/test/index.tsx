/**
 * External dependencies
 */
import { render, screen, renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getAutoCompleterUI } from '../autocompleter-ui';
import { useLastDifferentValue } from '..';

type FruitOption = { visual: string; name: string; id: number };

function makeRecord( text: string ) {
	return {
		text,
		formats: [],
		replacements: [],
		start: text.length,
		end: text.length,
	};
}

describe( 'useLastDifferentValue', () => {
	it( 'should return the current record on first render', () => {
		const record = makeRecord( 'Hello' );
		const { result } = renderHook(
			( { value } ) => useLastDifferentValue( value ),
			{ initialProps: { value: record } }
		);

		expect( result.current.text ).toBe( 'Hello' );
	} );

	it( 'should return the previous record when text changes', () => {
		const record1 = makeRecord( 'Hello' );
		const { result, rerender } = renderHook(
			( { value } ) => useLastDifferentValue( value ),
			{ initialProps: { value: record1 } }
		);

		const record2 = makeRecord( 'Hello/' );
		rerender( { value: record2 } );

		expect( result.current.text ).toBe( 'Hello' );
	} );

	it( 'should not update when re-rendered with a new reference but same text', () => {
		const record1 = makeRecord( 'Hello' );
		const { result, rerender } = renderHook(
			( { value } ) => useLastDifferentValue( value ),
			{ initialProps: { value: record1 } }
		);

		// User types "/"
		const record2 = makeRecord( 'Hello/' );
		rerender( { value: record2 } );
		expect( result.current.text ).toBe( 'Hello' );

		// RESET_BLOCKS creates a new record object with the same text.
		const record3 = makeRecord( 'Hello/' );
		rerender( { value: record3 } );
		expect( result.current.text ).toBe( 'Hello' );
	} );

	it( 'should survive multiple same-text re-renders', () => {
		const record1 = makeRecord( 'Hello' );
		const { result, rerender } = renderHook(
			( { value } ) => useLastDifferentValue( value ),
			{ initialProps: { value: record1 } }
		);

		// User types "/"
		const record2 = makeRecord( 'Hello/' );
		rerender( { value: record2 } );

		// Multiple syncs, each producing new references with the same text.
		for ( let i = 0; i < 5; i++ ) {
			rerender( { value: makeRecord( 'Hello/' ) } );
		}

		expect( result.current.text ).toBe( 'Hello' );
	} );

	it( 'should track consecutive text changes correctly', () => {
		const { result, rerender } = renderHook(
			( { value } ) => useLastDifferentValue( value ),
			{ initialProps: { value: makeRecord( 'A' ) } }
		);

		rerender( { value: makeRecord( 'AB' ) } );
		expect( result.current.text ).toBe( 'A' );

		rerender( { value: makeRecord( 'ABC' ) } );
		expect( result.current.text ).toBe( 'AB' );

		rerender( { value: makeRecord( 'ABCD' ) } );
		expect( result.current.text ).toBe( 'ABC' );
	} );

	it( 'should update when cursor position changes without text change', () => {
		const { result, rerender } = renderHook(
			( { value } ) => useLastDifferentValue( value ),
			{ initialProps: { value: makeRecord( 'Hello' ) } }
		);

		// User types "/"
		rerender( { value: makeRecord( 'Hello/' ) } );
		expect( result.current.text ).toBe( 'Hello' );

		// User moves cursor left (same text, different position).
		rerender( {
			value: { ...makeRecord( 'Hello/' ), start: 0, end: 0 },
		} );

		// The returned record should now match the current text,
		// so that didUserInput evaluates to false.
		expect( result.current.text ).toBe( 'Hello/' );
	} );
} );

describe( 'AutocompleterUI', () => {
	describe( 'click outside behavior', () => {
		it( 'should call reset function when a click on another element occurs', async () => {
			const user = userEvent.setup();

			const resetSpy = jest.fn();

			const autocompleter = {
				name: 'fruit',
				options: [
					{ visual: '🍎', name: 'Apple', id: 1 },
					{ visual: '🍊', name: 'Orange', id: 2 },
					{ visual: '🍇', name: 'Grapes', id: 3 },
				],
				// The prefix that triggers this completer
				triggerPrefix: '~',
				getOptionLabel: ( option: FruitOption ) => (
					<span>
						<span className="icon">{ option.visual }</span>
						{ option.name }
					</span>
				),
				// Mock useItems function to return a autocomplete item.
				useItems: ( filterValue: string ) => {
					const options = autocompleter.options;
					const keyedOptions = options.map(
						( optionData, optionIndex ) => ( {
							key: `${ autocompleter.name }-${ optionIndex }`,
							value: optionData,
							label: autocompleter.getOptionLabel( optionData ),
							keywords: [],
							isDisabled: false,
						} )
					);
					const filteredOptions = keyedOptions.filter( ( option ) =>
						option.value.name.includes( filterValue )
					);
					return [ filteredOptions ] as const;
				},
			};

			const AutocompleterUI = getAutoCompleterUI( autocompleter );

			const OtherElement = <div>Other Element</div>;

			const Container = () => {
				const contentRef = useRef< HTMLElement >( null );

				return (
					<div>
						<AutocompleterUI
							className="test"
							filterValue="Apple"
							instanceId={ 1 }
							listBoxId="1"
							selectedIndex={ 0 }
							onChangeOptions={ () => {} }
							onSelect={ () => {} }
							contentRef={ contentRef }
							reset={ resetSpy }
						/>
						{ OtherElement }
					</div>
				);
			};

			render( <Container /> );

			// Click on autocompleter.
			await user.click( screen.getByText( 'Apple' ) );

			expect( resetSpy ).toHaveBeenCalledTimes( 0 );

			// Click on other element out side of the tree.
			await user.click( screen.getByText( 'Other Element' ) );

			expect( resetSpy ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
