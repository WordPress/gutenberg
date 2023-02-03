/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getAutoCompleterUI } from '../autocompleter-ui';
import type { WPCompleter } from '../types';

describe( 'AutocompleterUI', () => {
	describe( 'click outside behavior', () => {
		it( 'should call reset function when a click on another element occurs', async () => {
			const user = userEvent.setup();

			const resetSpy = jest.fn();

			const autocompleter: WPCompleter = {
				name: 'fruit',
				options: [
					{ visual: '🍎', name: 'Apple', id: 1 },
					{ visual: '🍊', name: 'Orange', id: 2 },
					{ visual: '🍇', name: 'Grapes', id: 3 },
				],
				// The prefix that triggers this completer
				triggerPrefix: '~',
				getOptionLabel: ( option ) => (
					<span>
						<span className="icon">{ option.visual }</span>
						{ option.name }
					</span>
				),
				// Mock useItems function to return a autocomplete item.
				useItems: ( filterValue ) => {
					const options = autocompleter.options as Array< {
						visual: 'string';
						name: 'string';
						id: number;
					} >;
					const keyedOptions = options.map(
						( optionData, optionIndex ) => ( {
							key: `${ autocompleter.name }-${ optionIndex }`,
							value: optionData,
							label: autocompleter.getOptionLabel( optionData ),
							keywords: autocompleter.getOptionKeywords
								? autocompleter.getOptionKeywords( optionData )
								: [],
							isDisabled: autocompleter.isOptionDisabled
								? autocompleter.isOptionDisabled( optionData )
								: false,
						} )
					);
					const filteredOptions = keyedOptions.filter( ( option ) =>
						option.value.name.includes( filterValue )
					);
					return [ filteredOptions ];
				},
			};

			const AutocompleterUI = getAutoCompleterUI( autocompleter );

			const OtherElement = <div>Other Element</div>;

			const Container = () => {
				const contentRef = useRef();

				return (
					<div>
						<AutocompleterUI
							className={ 'test' }
							filterValue={ 'Apple' }
							instanceId={ 1 }
							listBoxId={ '1' }
							selectedIndex={ 0 }
							onChangeOptions={ () => {} }
							onSelect={ () => {} }
							value={ {
								text: 'This is the text that is being edited.',
								start: 0,
								end: 0,
							} }
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
