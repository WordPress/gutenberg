/**
 * Consecutive edits to the same entity property merge into one undo level when
 * the caller opts in with `coalesce`. Anything else starts a new level.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { createRegistry } from '@wordpress/data';
import { store as coreDataStore } from '../index';

vi.mock( '@wordpress/api-fetch' );

// The site entity is loaded lazily in production, so tests register it by hand.
const SITE_ENTITY = {
	kind: 'root',
	name: 'site',
	key: false,
	baseURL: '/wp/v2/settings',
};

// A keyed entity, so that the record ID takes part in the identity check.
const POST_ENTITY = {
	kind: 'postType',
	name: 'post',
	baseURL: '/wp/v2/posts',
};

const ORIGINAL = {
	title: 'Original Title',
	description: 'Original Tagline',
};

const ORIGINAL_POSTS = [
	{ id: 1, title: 'First Post' },
	{ id: 2, title: 'Second Post' },
];

const COALESCE = { coalesce: true };

function createTestRegistry() {
	const registry = createRegistry();
	registry.register( coreDataStore );
	registry
		.dispatch( coreDataStore )
		.addEntities( [ SITE_ENTITY, POST_ENTITY ] );
	registry
		.dispatch( coreDataStore )
		.receiveEntityRecords( 'root', 'site', { ...ORIGINAL } );
	registry
		.dispatch( coreDataStore )
		.receiveEntityRecords( 'postType', 'post', ORIGINAL_POSTS );
	return registry;
}

describe( 'undo coalescing', () => {
	let registry;

	beforeEach( () => {
		vi.useFakeTimers();
		apiFetch.mockReset();
		registry = createTestRegistry();
	} );

	afterEach( () => {
		vi.useRealTimers();
	} );

	function edit( prop, value, options, target = registry ) {
		target
			.dispatch( coreDataStore )
			.editEntityRecord(
				'root',
				'site',
				undefined,
				{ [ prop ]: value },
				options
			);
	}

	function editTitle( value, options ) {
		edit( 'title', value, options );
	}

	function editPost( id, value, options ) {
		registry
			.dispatch( coreDataStore )
			.editEntityRecord(
				'postType',
				'post',
				id,
				{ title: value },
				options
			);
	}

	function getPost( id ) {
		return registry
			.select( coreDataStore )
			.getEditedEntityRecord( 'postType', 'post', id );
	}

	function getRecord( target = registry ) {
		return target
			.select( coreDataStore )
			.getEditedEntityRecord( 'root', 'site' );
	}

	// The store exposes no level count, so drain the stack to measure it.
	function countUndoLevels( target = registry ) {
		let levels = 0;
		while ( target.select( coreDataStore ).hasUndo() ) {
			target.dispatch( coreDataStore ).undo();
			levels += 1;
		}
		return levels;
	}

	it( 'merges a burst of edits to one property into a single level', () => {
		editTitle( 'H', COALESCE );
		editTitle( 'He', COALESCE );
		editTitle( 'Hel', COALESCE );

		expect( countUndoLevels() ).toBe( 1 );
		expect( getRecord().title ).toBe( ORIGINAL.title );
	} );

	it( 'starts a new level once the coalescing window has passed', () => {
		editTitle( 'H', COALESCE );
		editTitle( 'He', COALESCE );
		vi.advanceTimersByTime( 1000 );
		editTitle( 'Hel', COALESCE );
		editTitle( 'Hell', COALESCE );

		expect( countUndoLevels() ).toBe( 2 );
	} );

	it( 'does not fold an edit into the level of an unrelated property', () => {
		editTitle( 'New Title', COALESCE );
		edit( 'description', 'New Tagline', COALESCE );
		editTitle( 'Newer Title', COALESCE );

		expect( countUndoLevels() ).toBe( 3 );
	} );

	it.each( [
		[ 'no options', undefined ],
		[ '`isCached: false`', { isCached: false } ],
	] )(
		'starts a new level when a plain edit (%s) interrupts a run',
		( _label, options ) => {
			editTitle( 'New Title', COALESCE );
			edit( 'description', 'New Tagline', options );
			editTitle( 'Newer Title', COALESCE );

			expect( countUndoLevels() ).toBe( 3 );
		}
	);

	it( 'starts a new level when the set of edited keys changes', () => {
		editTitle( 'New Title', COALESCE );
		registry
			.dispatch( coreDataStore )
			.editEntityRecord(
				'root',
				'site',
				undefined,
				{ title: 'Newer Title', description: 'New Tagline' },
				COALESCE
			);

		expect( countUndoLevels() ).toBe( 2 );
	} );

	it( 'starts a new level when the edited record changes', () => {
		editPost( 1, 'Edited First', COALESCE );
		editPost( 2, 'Edited Second', COALESCE );
		editPost( 1, 'Edited First Again', COALESCE );

		expect( countUndoLevels() ).toBe( 3 );
	} );

	it( 'folds into the matching record and leaves the others alone', () => {
		editPost( 1, 'E', COALESCE );
		editPost( 1, 'Ed', COALESCE );
		editPost( 2, 'Edited Second', COALESCE );

		registry.dispatch( coreDataStore ).undo();

		expect( getPost( 2 ).title ).toBe( 'Second Post' );
		expect( getPost( 1 ).title ).toBe( 'Ed' );
	} );

	it( 'stages an explicit `isCached` edit regardless of identity', () => {
		editTitle( 'New Title' );
		edit( 'description', 'New Tagline', { isCached: true } );

		expect( countUndoLevels() ).toBe( 1 );
	} );

	it( 'keeps a run open across an `undoIgnore` edit', () => {
		editTitle( 'H', COALESCE );
		edit( 'description', 'Ignored Tagline', { undoIgnore: true } );
		editTitle( 'He', COALESCE );

		expect( countUndoLevels() ).toBe( 1 );
	} );

	it( 'does not start a run on an edit that changes nothing', () => {
		edit( 'description', 'New Tagline' );
		// The Site Title block trims its value, so typing a trailing space
		// edits the title to the value it already has.
		editTitle( ORIGINAL.title, COALESCE );
		editTitle( 'New Title', COALESCE );

		registry.dispatch( coreDataStore ).undo();

		expect( getRecord().title ).toBe( ORIGINAL.title );
		expect( getRecord().description ).toBe( 'New Tagline' );
	} );

	it( 'does not end a run on an edit that changes nothing', () => {
		editTitle( 'H', COALESCE );
		edit( 'description', ORIGINAL.description, COALESCE );
		editTitle( 'He', COALESCE );

		registry.dispatch( coreDataStore ).undo();

		expect( getRecord().title ).toBe( ORIGINAL.title );
		expect( registry.select( coreDataStore ).hasUndo() ).toBe( false );
	} );

	it( 'starts a new level when editing after an undo', () => {
		editTitle( 'H', COALESCE );
		editTitle( 'He', COALESCE );

		registry.dispatch( coreDataStore ).undo();
		expect( registry.select( coreDataStore ).hasRedo() ).toBe( true );

		editTitle( 'Ha', COALESCE );

		// A staged edit does not drop pending redos, so a stale session would
		// leave a redo entry that no longer matches the history.
		expect( registry.select( coreDataStore ).hasRedo() ).toBe( false );
	} );

	it( 'starts a new level when editing after a redo', () => {
		editTitle( 'H', COALESCE );
		vi.advanceTimersByTime( 1000 );
		editTitle( 'He', COALESCE );

		registry.dispatch( coreDataStore ).undo();
		registry.dispatch( coreDataStore ).redo();

		editTitle( 'Hel', COALESCE );

		expect( countUndoLevels() ).toBe( 3 );
	} );

	it( 'ends the run when `saveEntityRecord` is called directly', async () => {
		// Real timers: resolving the entity config goes through the data
		// registry's async resolver queue, which never drains under fake ones.
		vi.useRealTimers();
		apiFetch.mockResolvedValue( { ...ORIGINAL } );

		editTitle( 'H', COALESCE );
		await registry
			.dispatch( coreDataStore )
			.saveEntityRecord( 'root', 'site', { title: 'H' } );
		editTitle( 'He', COALESCE );

		expect( countUndoLevels() ).toBe( 2 );
	} );

	it( 'ends the run when `saveEditedEntityRecord` is called', async () => {
		// Real timers: resolving the entity config goes through the data
		// registry's async resolver queue, which never drains under fake ones.
		vi.useRealTimers();
		apiFetch.mockResolvedValue( { ...ORIGINAL } );

		editTitle( 'H', COALESCE );
		await registry
			.dispatch( coreDataStore )
			.saveEditedEntityRecord( 'root', 'site' );
		editTitle( 'He', COALESCE );

		expect( countUndoLevels() ).toBe( 2 );
	} );

	it( 'keeps the run open across an autosave', async () => {
		// Real timers: resolving the entity config goes through the data
		// registry's async resolver queue, which never drains under fake ones.
		vi.useRealTimers();
		apiFetch.mockResolvedValue( { ...ORIGINAL } );

		editTitle( 'H', COALESCE );
		await registry
			.dispatch( coreDataStore )
			.saveEntityRecord(
				'root',
				'site',
				{ title: 'H' },
				{ isAutosave: true }
			);
		editTitle( 'He', COALESCE );

		expect( countUndoLevels() ).toBe( 1 );
	} );

	it( 'ends the run when edits are discarded', () => {
		editTitle( 'H', COALESCE );
		registry
			.dispatch( coreDataStore )
			.clearEntityRecordEdits( 'root', 'site' );
		editTitle( 'He', COALESCE );

		expect( countUndoLevels() ).toBe( 2 );
	} );

	it( 'ends the run on `__unstableCreateUndoLevel`', () => {
		editTitle( 'H', COALESCE );
		registry.dispatch( coreDataStore ).__unstableCreateUndoLevel();
		editTitle( 'He', COALESCE );

		expect( countUndoLevels() ).toBe( 2 );
	} );

	it( 'keeps sessions separate between registries', () => {
		const otherRegistry = createTestRegistry();

		editTitle( 'H', COALESCE );
		// A different key set. Were the session shared, this would end the run.
		edit( 'description', 'New Tagline', COALESCE, otherRegistry );
		editTitle( 'He', COALESCE );

		expect( countUndoLevels() ).toBe( 1 );
		expect( countUndoLevels( otherRegistry ) ).toBe( 1 );
	} );
} );
