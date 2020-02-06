/**
 * External dependencies
 */
import deepFreeze from 'deep-freeze';
import { filter } from 'lodash';

/**
 * Internal dependencies
 */
import {
	terms,
	entities,
	undo,
	embedPreviews,
	userPermissions,
	autosaves,
	currentUser,
} from '../reducer';

describe( 'terms()', () => {
	it( 'returns an empty object by default', () => {
		const state = terms( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'returns with received terms', () => {
		const originalState = deepFreeze( {} );
		const state = terms( originalState, {
			type: 'RECEIVE_TERMS',
			taxonomy: 'categories',
			terms: [ { id: 1 } ],
		} );

		expect( state ).toEqual( {
			categories: [ { id: 1 } ],
		} );
	} );
} );

describe( 'entities', () => {
	it( 'returns the default state for all defined entities', () => {
		const state = entities( undefined, {} );

		expect( state.data.root.postType.queriedData ).toEqual( {
			items: {},
			queries: {},
		} );
	} );

	it( 'returns with received post types by slug', () => {
		const originalState = deepFreeze( {} );
		const state = entities( originalState, {
			type: 'RECEIVE_ITEMS',
			items: [
				{ slug: 'b', title: 'beach' },
				{ slug: 's', title: 'sun' },
			],
			kind: 'root',
			name: 'postType',
		} );

		expect( state.data.root.postType.queriedData ).toEqual( {
			items: {
				b: { slug: 'b', title: 'beach' },
				s: { slug: 's', title: 'sun' },
			},
			queries: {},
		} );
	} );

	it( 'appends the received post types by slug', () => {
		const originalState = deepFreeze( {
			data: {
				root: {
					postType: {
						queriedData: {
							items: {
								w: { slug: 'w', title: 'water' },
							},
							queries: {},
						},
					},
				},
			},
		} );
		const state = entities( originalState, {
			type: 'RECEIVE_ITEMS',
			items: [ { slug: 'b', title: 'beach' } ],
			kind: 'root',
			name: 'postType',
		} );

		expect( state.data.root.postType.queriedData ).toEqual( {
			items: {
				w: { slug: 'w', title: 'water' },
				b: { slug: 'b', title: 'beach' },
			},
			queries: {},
		} );
	} );

	it( 'returns with updated entities config', () => {
		const originalState = deepFreeze( {} );
		const state = entities( originalState, {
			type: 'ADD_ENTITIES',
			entities: [ { kind: 'postType', name: 'posts' } ],
		} );

		expect( filter( state.config, { kind: 'postType' } ) ).toEqual( [
			{ kind: 'postType', name: 'posts' },
		] );
	} );
} );

describe( 'undo', () => {
	let lastEdits;
	let undoState;
	let expectedUndoState;
	const createEditActionPart = ( edits ) => ( {
		kind: 'someKind',
		name: 'someName',
		recordId: 'someRecordId',
		edits,
	} );
	const createNextEditAction = ( edits, transientEdits = {} ) => {
		let action = {
			...createEditActionPart( edits ),
			transientEdits,
		};
		action = {
			type: 'EDIT_ENTITY_RECORD',
			...action,
			meta: {
				undo: { ...action, edits: lastEdits },
			},
		};
		lastEdits = { ...lastEdits, ...edits };
		return action;
	};
	const createNextUndoState = ( ...args ) => {
		let action = {};
		if ( args[ 0 ] === 'isUndo' || args[ 0 ] === 'isRedo' ) {
			// We need to "apply" the undo level here and build
			// the action to move the offset.
			lastEdits =
				undoState[
					undoState.length +
						undoState.offset -
						( args[ 0 ] === 'isUndo' ? 2 : 0 )
				].edits;
			action = {
				type: 'EDIT_ENTITY_RECORD',
				meta: {
					[ args[ 0 ] ]: true,
				},
			};
		} else if ( args[ 0 ] === 'isCreate' ) {
			action = { type: 'CREATE_UNDO_LEVEL' };
		} else if ( args.length ) {
			action = createNextEditAction( ...args );
		}
		return deepFreeze( undo( undoState, action ) );
	};
	beforeEach( () => {
		lastEdits = {};
		undoState = undefined;
		expectedUndoState = [];
		expectedUndoState.offset = 0;
	} );

	it( 'initializes', () => {
		expect( createNextUndoState() ).toEqual( expectedUndoState );
	} );

	it( 'stacks undo levels', () => {
		undoState = createNextUndoState();

		// Check that the first edit creates an undo level for the current state and
		// one for the new one.
		undoState = createNextUndoState( { value: 1 } );
		expectedUndoState.push(
			createEditActionPart( {} ),
			createEditActionPart( { value: 1 } )
		);
		expect( undoState ).toEqual( expectedUndoState );

		// Check that the second and third edits just create an undo level for
		// themselves.
		undoState = createNextUndoState( { value: 2 } );
		expectedUndoState.push( createEditActionPart( { value: 2 } ) );
		expect( undoState ).toEqual( expectedUndoState );
		undoState = createNextUndoState( { value: 3 } );
		expectedUndoState.push( createEditActionPart( { value: 3 } ) );
		expect( undoState ).toEqual( expectedUndoState );
	} );

	it( 'handles undos/redos', () => {
		undoState = createNextUndoState();
		undoState = createNextUndoState( { value: 1 } );
		undoState = createNextUndoState( { value: 2 } );
		undoState = createNextUndoState( { value: 3 } );
		expectedUndoState.push(
			createEditActionPart( {} ),
			createEditActionPart( { value: 1 } ),
			createEditActionPart( { value: 2 } ),
			createEditActionPart( { value: 3 } )
		);
		expect( undoState ).toEqual( expectedUndoState );

		// Check that undoing and redoing an equal
		// number of steps does not lose edits.
		undoState = createNextUndoState( 'isUndo' );
		expectedUndoState.offset--;
		expect( undoState ).toEqual( expectedUndoState );
		undoState = createNextUndoState( 'isUndo' );
		expectedUndoState.offset--;
		expect( undoState ).toEqual( expectedUndoState );
		undoState = createNextUndoState( 'isRedo' );
		expectedUndoState.offset++;
		expect( undoState ).toEqual( expectedUndoState );
		undoState = createNextUndoState( 'isRedo' );
		expectedUndoState.offset++;
		expect( undoState ).toEqual( expectedUndoState );

		// Check that another edit will go on top when there
		// is no undo level offset.
		undoState = createNextUndoState( { value: 4 } );
		expectedUndoState.push( createEditActionPart( { value: 4 } ) );
		expect( undoState ).toEqual( expectedUndoState );

		// Check that undoing and editing will slice of
		// all the levels after the current one.
		undoState = createNextUndoState( 'isUndo' );
		undoState = createNextUndoState( 'isUndo' );
		undoState = createNextUndoState( { value: 5 } );
		expectedUndoState.pop();
		expectedUndoState.pop();
		expectedUndoState.push( createEditActionPart( { value: 5 } ) );
		expect( undoState ).toEqual( expectedUndoState );
	} );

	it( 'handles flattened undos/redos', () => {
		undoState = createNextUndoState();
		undoState = createNextUndoState( { value: 1 } );
		undoState = createNextUndoState(
			{ transientValue: 2 },
			{ transientValue: true }
		);
		undoState = createNextUndoState( { value: 3 } );
		expectedUndoState.push(
			createEditActionPart( {} ),
			createEditActionPart( { value: 1, transientValue: 2 } ),
			createEditActionPart( { value: 3 } )
		);
		expect( undoState ).toEqual( expectedUndoState );
	} );

	it( 'handles explicit undo level creation', () => {
		undoState = createNextUndoState();

		// Check that nothing happens if there are no pending
		// transient edits.
		undoState = createNextUndoState( { value: 1 } );
		undoState = createNextUndoState( 'isCreate' );
		expectedUndoState.push(
			createEditActionPart( {} ),
			createEditActionPart( { value: 1 } )
		);
		expect( undoState ).toEqual( expectedUndoState );

		// Check that transient edits are merged into the last
		// edits.
		undoState = createNextUndoState(
			{ transientValue: 2 },
			{ transientValue: true }
		);
		undoState = createNextUndoState( 'isCreate' );
		expectedUndoState[
			expectedUndoState.length - 1
		].edits.transientValue = 2;
		expect( undoState ).toEqual( expectedUndoState );

		// Check that undo levels are created with the latest action,
		// even if undone.
		undoState = createNextUndoState( { value: 3 } );
		undoState = createNextUndoState( 'isUndo' );
		undoState = createNextUndoState( 'isCreate' );
		expectedUndoState.pop();
		expectedUndoState.push( createEditActionPart( { value: 3 } ) );
		expect( undoState ).toEqual( expectedUndoState );
	} );

	it( 'explicitly creates an undo level when undoing while there are pending transient edits', () => {
		undoState = createNextUndoState();
		undoState = createNextUndoState( { value: 1 } );
		undoState = createNextUndoState(
			{ transientValue: 2 },
			{ transientValue: true }
		);
		undoState = createNextUndoState( 'isUndo' );
		expectedUndoState.push(
			createEditActionPart( {} ),
			createEditActionPart( { value: 1, transientValue: 2 } )
		);
		expectedUndoState.offset--;
		expect( undoState ).toEqual( expectedUndoState );
	} );

	it( 'does not create new levels for the same function edits', () => {
		const value = () => {};
		undoState = createNextUndoState();
		undoState = createNextUndoState( { value } );
		undoState = createNextUndoState( { value: () => {} } );
		expectedUndoState.push( createEditActionPart( { value } ) );
		expect( undoState ).toEqual( expectedUndoState );
	} );
} );

describe( 'embedPreviews()', () => {
	it( 'returns an empty object by default', () => {
		const state = embedPreviews( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'returns with received preview', () => {
		const originalState = deepFreeze( {} );
		const state = embedPreviews( originalState, {
			type: 'RECEIVE_EMBED_PREVIEW',
			url: 'http://twitter.com/notnownikki',
			preview: { data: 42 },
		} );

		expect( state ).toEqual( {
			'http://twitter.com/notnownikki': { data: 42 },
		} );
	} );
} );

describe( 'userPermissions()', () => {
	it( 'defaults to an empty object', () => {
		const state = userPermissions( undefined, {} );
		expect( state ).toEqual( {} );
	} );

	it( 'updates state with whether an action is allowed', () => {
		const original = deepFreeze( {
			'create/media': false,
		} );

		const state = userPermissions( original, {
			type: 'RECEIVE_USER_PERMISSION',
			key: 'create/media',
			isAllowed: true,
		} );

		expect( state ).toEqual( {
			'create/media': true,
		} );
	} );
} );

describe( 'autosaves', () => {
	it( 'returns an empty object by default', () => {
		const state = autosaves( undefined, {} );

		expect( state ).toEqual( {} );
	} );

	it( 'returns the current state with the new autosaves merged in, keyed by the parent post id', () => {
		const existingAutosaves = [
			{
				title: {
					raw: 'Some',
				},
				content: {
					raw: 'other',
				},
				excerpt: {
					raw: 'autosave',
				},
				status: 'publish',
			},
		];

		const newAutosaves = [
			{
				title: {
					raw: 'The Title',
				},
				content: {
					raw: 'The Content',
				},
				excerpt: {
					raw: 'The Excerpt',
				},
				status: 'draft',
			},
		];

		const state = autosaves(
			{ 1: existingAutosaves },
			{
				type: 'RECEIVE_AUTOSAVES',
				postId: 2,
				autosaves: newAutosaves,
			}
		);

		expect( state ).toEqual( {
			1: existingAutosaves,
			2: newAutosaves,
		} );
	} );

	it( 'overwrites any existing state if new autosaves are received with the same post id', () => {
		const existingAutosaves = [
			{
				title: {
					raw: 'Some',
				},
				content: {
					raw: 'other',
				},
				excerpt: {
					raw: 'autosave',
				},
				status: 'publish',
			},
		];

		const newAutosaves = [
			{
				title: {
					raw: 'The Title',
				},
				content: {
					raw: 'The Content',
				},
				excerpt: {
					raw: 'The Excerpt',
				},
				status: 'draft',
			},
		];

		const state = autosaves(
			{ 1: existingAutosaves },
			{
				type: 'RECEIVE_AUTOSAVES',
				postId: 1,
				autosaves: newAutosaves,
			}
		);

		expect( state ).toEqual( {
			1: newAutosaves,
		} );
	} );
} );

describe( 'currentUser', () => {
	it( 'returns an empty object by default', () => {
		const state = currentUser( undefined, {} );
		expect( state ).toEqual( {} );
	} );

	it( 'returns the current user', () => {
		const currentUserData = { id: 1 };

		const state = currentUser(
			{},
			{
				type: 'RECEIVE_CURRENT_USER',
				currentUser: currentUserData,
			}
		);

		expect( state ).toEqual( currentUserData );
	} );

	it( 'overwrites any existing current user state', () => {
		const currentUserData = { id: 2 };

		const state = currentUser(
			{ id: 1 },
			{
				type: 'RECEIVE_CURRENT_USER',
				currentUser: currentUserData,
			}
		);

		expect( state ).toEqual( currentUserData );
	} );
} );
