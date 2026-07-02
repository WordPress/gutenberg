/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );
jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: jest.fn(),
} ) );
jest.mock(
	'@wordpress/data/src/components/registry-provider/use-registry',
	() => jest.fn( () => ( {} ) )
);

jest.useFakeTimers();
jest.spyOn( global, 'setInterval' );

// The module under test captures `window.requestIdleCallback` at import time,
// so a synchronous implementation must be installed before requiring it.
window.requestIdleCallback = ( callback ) => callback();
const { default: LocalAutosaveMonitor } = require( '../local' );

// The current edited-post state, read live by the mocked selectors so it can be
// changed between timer ticks without re-rendering the component.
let state;

function setState( overrides = {} ) {
	state = {
		editsReference: 1,
		isDirty: false,
		isAutosaveable: false,
		isAutosaving: false,
		localAutosaveInterval: 15,
		...overrides,
	};
}

describe( 'LocalAutosaveMonitor', () => {
	let autosave;

	beforeEach( () => {
		setState();
		useSelect.mockImplementation( ( mapSelectOrStore ) => {
			const selectors = {
				getReferenceByDistinctEdits: () => state.editsReference,
				isEditedPostDirty: () => state.isDirty,
				isEditedPostAutosaveable: () => state.isAutosaveable,
				isAutosavingPost: () => state.isAutosaving,
				getCurrentPostId: () => 1,
				isEditedPostNew: () => false,
				didPostSaveRequestFail: () => false,
				getEditorSettings: () => ( {
					localAutosaveInterval: state.localAutosaveInterval,
				} ),
			};
			if ( typeof mapSelectOrStore === 'function' ) {
				return mapSelectOrStore( () => selectors );
			}
			return selectors;
		} );
		autosave = jest.fn();
		useDispatch.mockReturnValue( { autosave } );
		setInterval.mockClear();
	} );

	it( 'should schedule ticks using the localAutosaveInterval setting', () => {
		setState( { localAutosaveInterval: 42 } );
		render( <LocalAutosaveMonitor /> );

		expect( setInterval ).toHaveBeenLastCalledWith(
			expect.any( Function ),
			42000
		);
	} );

	it( 'should save a local autosave on the timer tick', () => {
		setState( { isDirty: true, isAutosaveable: true } );
		render( <LocalAutosaveMonitor /> );

		jest.advanceTimersByTime( 15000 );

		expect( autosave ).toHaveBeenCalledTimes( 1 );
		expect( autosave ).toHaveBeenCalledWith( { local: true } );
	} );

	// Characterization of behavior the local monitor inherits by reusing the
	// remote engine. Local autosaves only write to sessionStorage, yet they are
	// gated by remote (REST) save state. Expected to change with the planned
	// per-kind decision logic; see the AutosaveMonitor follow-up work.
	describe( 'divergence inherited from the remote monitor', () => {
		it( 'should skip the local backup while a remote autosave is in flight', () => {
			setState( {
				isDirty: true,
				isAutosaveable: true,
				isAutosaving: true,
			} );
			render( <LocalAutosaveMonitor /> );

			jest.advanceTimersByTime( 15000 );

			expect( autosave ).not.toHaveBeenCalled();
		} );

		it( 'should skip the local backup while the post is not autosaveable against the server autosave', () => {
			// `isEditedPostAutosaveable()` compares edits against the *server*
			// autosave and returns false until that autosave has loaded — a
			// baseline and a fetch that a sessionStorage backup doesn't need.
			setState( { isDirty: true, isAutosaveable: false } );
			render( <LocalAutosaveMonitor /> );

			jest.advanceTimersByTime( 15000 );

			expect( autosave ).not.toHaveBeenCalled();
		} );
	} );
} );
