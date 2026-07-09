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

// sessionStorage key used by the local-autosave store helpers for post ID 1.
const BACKUP_KEY = 'wp-autosave-block-editor-post-1';

// The current edited-post state, read live by the mocked selectors so it can be
// changed between timer ticks without re-rendering the component.
let state;

function setState( overrides = {} ) {
	state = {
		editsReference: 1,
		isEmpty: false,
		isDirty: false,
		isAutosavingLocked: false,
		supportsAutosave: true,
		isAutosaving: false,
		localAutosaveInterval: 15,
		editedPost: { title: 'title', content: 'content', excerpt: 'excerpt' },
		...overrides,
	};
}

describe( 'LocalAutosaveMonitor', () => {
	let autosave;

	beforeEach( () => {
		setState();
		window.sessionStorage.clear();
		useSelect.mockImplementation( ( mapSelectOrStore ) => {
			const selectors = {
				getReferenceByDistinctEdits: () => state.editsReference,
				getPostType: () => ( {
					supports: { autosave: state.supportsAutosave },
				} ),
				getCurrentPostId: () => 1,
				isEditedPostNew: () => false,
				isEditedPostEmpty: () => state.isEmpty,
				isEditedPostDirty: () => state.isDirty,
				isPostAutosavingLocked: () => state.isAutosavingLocked,
				isAutosavingPost: () => state.isAutosaving,
				didPostSaveRequestFail: () => false,
				getEditedPostAttribute: ( attribute ) =>
					state.editedPost[ attribute ],
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
		setState( { isDirty: true } );
		render( <LocalAutosaveMonitor /> );

		jest.advanceTimersByTime( 15000 );

		expect( autosave ).toHaveBeenCalledTimes( 1 );
		expect( autosave ).toHaveBeenCalledWith( { local: true } );
	} );

	it( 'should not save again until there are new edits', () => {
		setState( { isDirty: true } );
		render( <LocalAutosaveMonitor /> );

		jest.advanceTimersByTime( 15000 );
		expect( autosave ).toHaveBeenCalledTimes( 1 );

		// No new edits: a subsequent tick should not save again.
		jest.advanceTimersByTime( 15000 );
		expect( autosave ).toHaveBeenCalledTimes( 1 );

		// A new distinct edit triggers another local autosave.
		setState( { isDirty: true, editsReference: 2 } );
		jest.advanceTimersByTime( 15000 );
		expect( autosave ).toHaveBeenCalledTimes( 2 );
	} );

	it.each( [
		{
			scenario: 'the post is not dirty',
			overrides: { isDirty: false },
		},
		{
			scenario: 'the post has no saveable content',
			overrides: {
				isDirty: true,
				isEmpty: true,
				editedPost: { title: '', content: '', excerpt: '' },
			},
		},
		{
			scenario: 'autosaving is locked',
			overrides: {
				isDirty: true,
				isAutosavingLocked: true,
			},
		},
		{
			scenario: 'the post type does not support autosaves',
			overrides: {
				isDirty: true,
				supportsAutosave: false,
			},
		},
	] )( 'should not save when $scenario', ( { overrides } ) => {
		setState( overrides );
		render( <LocalAutosaveMonitor /> );

		jest.advanceTimersByTime( 15000 );

		expect( autosave ).not.toHaveBeenCalled();
	} );

	it.each( [
		{
			name: 'skip the backup when it already matches the edited post',
			content: 'content',
			expectedCalls: 0,
		},
		{
			name: 'save when the backup differs from the edited post',
			content: 'stale content',
			expectedCalls: 1,
		},
	] )( 'should $name', ( { content, expectedCalls } ) => {
		setState( { isDirty: true } );
		render( <LocalAutosaveMonitor /> );

		window.sessionStorage.setItem(
			BACKUP_KEY,
			JSON.stringify( {
				post_title: 'title',
				content,
				excerpt: 'excerpt',
			} )
		);
		jest.advanceTimersByTime( 15000 );

		expect( autosave ).toHaveBeenCalledTimes( expectedCalls );
	} );
} );
