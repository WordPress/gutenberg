/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import AutosaveMonitor from '../';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: jest.fn(),
} ) );

jest.useFakeTimers();
jest.spyOn( global, 'clearInterval' );
jest.spyOn( global, 'setInterval' );

// The current edited-post state, read live by the mocked selectors so it can be
// changed between timer ticks without re-rendering the component.
let state;

function setState( overrides = {} ) {
	state = {
		editsReference: 1,
		isDirty: false,
		isAutosaveable: false,
		isAutosaving: false,
		autosaveInterval: 10,
		...overrides,
	};
}

describe( 'AutosaveMonitor', () => {
	beforeEach( () => {
		setState();
		// `useSelect( store )` (static mode) returns bound selectors; the
		// component destructures the ones it needs from each call. The mapping
		// form `useSelect( mapSelect )` receives a `select` that resolves to the
		// same selectors.
		useSelect.mockImplementation( ( mapSelectOrStore ) => {
			const selectors = {
				getReferenceByDistinctEdits: () => state.editsReference,
				isEditedPostDirty: () => state.isDirty,
				isEditedPostAutosaveable: () => state.isAutosaveable,
				isAutosavingPost: () => state.isAutosaving,
				getEditorSettings: () => ( {
					autosaveInterval: state.autosaveInterval,
				} ),
			};
			if ( typeof mapSelectOrStore === 'function' ) {
				return mapSelectOrStore( () => selectors );
			}
			return selectors;
		} );
		useDispatch.mockReturnValue( { autosave: jest.fn() } );
		setInterval.mockClear();
		clearInterval.mockClear();
	} );

	it( 'should render nothing', () => {
		const { container } = render( <AutosaveMonitor /> );

		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'should start the autosave timer after being mounted', () => {
		render( <AutosaveMonitor /> );

		expect( setInterval ).toHaveBeenCalled();
	} );

	it( 'should clear the autosave timer after being unmounted', () => {
		const { rerender } = render( <AutosaveMonitor /> );

		rerender( <div /> );

		expect( clearInterval ).toHaveBeenCalled();
	} );

	it( 'should restart the autosave timer when the interval changes', () => {
		const { rerender } = render( <AutosaveMonitor interval={ 10 } /> );

		setInterval.mockClear();
		clearInterval.mockClear();
		rerender( <AutosaveMonitor interval={ 999 } /> );

		expect( clearInterval ).toHaveBeenCalled();
		expect( setInterval ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should schedule the timer using the interval in seconds', () => {
		render( <AutosaveMonitor interval={ 5 } /> );

		expect( setInterval ).toHaveBeenLastCalledWith(
			expect.any( Function ),
			5000
		);
	} );

	it( 'should fall back to the editor autosaveInterval setting', () => {
		setState( { autosaveInterval: 7 } );
		render( <AutosaveMonitor /> );

		expect( setInterval ).toHaveBeenLastCalledWith(
			expect.any( Function ),
			7000
		);
	} );

	it( 'should autosave a dirty, autosaveable post on the timer tick', () => {
		const autosave = jest.fn();
		setState( { isDirty: true, isAutosaveable: true } );
		render( <AutosaveMonitor autosave={ autosave } interval={ 5 } /> );

		expect( autosave ).not.toHaveBeenCalled();

		jest.advanceTimersByTime( 5000 );

		expect( autosave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not autosave when the post is not dirty', () => {
		const autosave = jest.fn();
		setState( { isDirty: false, isAutosaveable: true } );
		render( <AutosaveMonitor autosave={ autosave } interval={ 5 } /> );

		jest.advanceTimersByTime( 5000 );

		expect( autosave ).not.toHaveBeenCalled();
	} );

	it( 'should not autosave while an autosave is already in progress', () => {
		const autosave = jest.fn();
		setState( { isDirty: true, isAutosaveable: true, isAutosaving: true } );
		render( <AutosaveMonitor autosave={ autosave } interval={ 5 } /> );

		jest.advanceTimersByTime( 5000 );

		expect( autosave ).not.toHaveBeenCalled();
	} );

	it( 'should autosave edits made during an in-progress autosave once it finishes', () => {
		const autosave = jest.fn();
		setState( { isDirty: true, isAutosaveable: true } );
		render( <AutosaveMonitor autosave={ autosave } interval={ 5 } /> );

		// New edit arrives while an autosave is already in progress: the tick
		// should not consume the edits reference nor trigger an autosave.
		setState( {
			isDirty: true,
			isAutosaveable: true,
			isAutosaving: true,
			editsReference: 2,
		} );
		jest.advanceTimersByTime( 5000 );
		expect( autosave ).not.toHaveBeenCalled();

		// Once the autosave finishes, the pending edit must still be autosaved.
		setState( { isDirty: true, isAutosaveable: true, editsReference: 2 } );
		jest.advanceTimersByTime( 5000 );
		expect( autosave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not autosave again until there are new edits', () => {
		const autosave = jest.fn();
		setState( { isDirty: true, isAutosaveable: true } );
		render( <AutosaveMonitor autosave={ autosave } interval={ 5 } /> );

		jest.advanceTimersByTime( 5000 );
		expect( autosave ).toHaveBeenCalledTimes( 1 );

		// No new edits: a subsequent tick should not autosave again.
		jest.advanceTimersByTime( 5000 );
		expect( autosave ).toHaveBeenCalledTimes( 1 );

		// A new distinct edit triggers another autosave.
		setState( { isDirty: true, isAutosaveable: true, editsReference: 2 } );
		jest.advanceTimersByTime( 5000 );
		expect( autosave ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'should keep pending edits and retry once the post becomes autosaveable', () => {
		const autosave = jest.fn();
		setState( { isDirty: true, isAutosaveable: false, editsReference: 2 } );
		render( <AutosaveMonitor autosave={ autosave } interval={ 5 } /> );

		jest.advanceTimersByTime( 5000 );
		expect( autosave ).not.toHaveBeenCalled();

		setState( { isDirty: true, isAutosaveable: true, editsReference: 2 } );
		jest.advanceTimersByTime( 5000 );
		expect( autosave ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should fall back to the editor store autosave action', () => {
		const autosave = jest.fn();
		useDispatch.mockReturnValue( { autosave } );
		setState( { isDirty: true, isAutosaveable: true } );
		render( <AutosaveMonitor interval={ 5 } /> );

		jest.advanceTimersByTime( 5000 );

		expect( autosave ).toHaveBeenCalledTimes( 1 );
	} );
} );
