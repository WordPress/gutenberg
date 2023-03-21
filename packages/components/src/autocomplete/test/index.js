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

describe( 'AutocompleterUI', () => {
	describe( 'click outside behavior', () => {
		it( 'should call reset function when a click on another element occurs', async () => {
			const user = userEvent.setup();

			const resetSpy = jest.fn();

			const autocompleter = {
				name: 'fruit',
				// The prefix that triggers this completer
				triggerPrefix: '~',
				// Mock useItems function to return a autocomplete item.
				useItems: () => {
					return [
						[
							{
								isDisabled: false,
								key: 'Apple',
								value: 'Apple',
								label: (
									<span>
										<span className="icon">🍎</span>
										{ 'Apple' }
									</span>
								),
							},
						],
					];
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
							filterValue={ '~' }
							instanceId={ '1' }
							listBoxId={ '1' }
							selectedIndex={ 0 }
							onChangeOptions={ () => {} }
							onSelect={ () => {} }
							value={ { visual: '🍎', name: 'Apple', id: 1 } }
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
