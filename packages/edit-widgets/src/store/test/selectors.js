/**
 * Internal dependencies
 */
import * as _selectors from '../selectors';

const selectors = { ..._selectors };
const { isWidgetSavingLocked } = selectors;

describe( 'selectors', () => {
	describe( 'isWidgetSavingLocked', () => {
		it( 'should return true if the post has widgetSavingLocks', () => {
			const state = {
				widgetSavingLock: { example: true },
				currentWidget: {},
				saving: {},
			};

			expect( isWidgetSavingLocked( state ) ).toBe( true );
		} );

		it( 'should return false if the post has no widgetSavingLocks', () => {
			const state = {
				widgetSavingLock: {},
				currentWidget: {},
				saving: {},
			};

			expect( isWidgetSavingLocked( state ) ).toBe( false );
		} );
	} );
} );
