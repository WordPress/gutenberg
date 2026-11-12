import { expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import CircularOptionPicker from '..';
import { CircularOptionPickerContext } from '../circular-option-picker-context';
import { Composite } from '../../composite';

it.each( [ 'removed', 'deselected' ] )(
	'does not activate a selected option after it is %s',
	( change ) => {
		vi.useFakeTimers();
		const setActiveId = vi.fn();
		const renderOptions = ( {
			isSelected = true,
			isPresent = true,
		} = {} ) => (
			<CircularOptionPickerContext.Provider
				value={ { presentation: 'listbox', setActiveId } }
			>
				<Composite role="listbox">
					{ isPresent && (
						<CircularOptionPicker.Option
							aria-label="Blue"
							isSelected={ isSelected }
						/>
					) }
				</Composite>
			</CircularOptionPickerContext.Provider>
		);
		const view = render( renderOptions() );

		try {
			expect( setActiveId ).not.toHaveBeenCalled();
			view.rerender(
				renderOptions( {
					isPresent: change !== 'removed',
					isSelected: false,
				} )
			);
			act( () => vi.runOnlyPendingTimers() );
			expect( setActiveId ).not.toHaveBeenCalled();
		} finally {
			view.unmount();
			vi.useRealTimers();
		}
	}
);
