/**
 * A cached edit merges into the previous undo level only when it continues the
 * same run: the last undoable edit was to the same record and shared a key.
 * Anything else starts a new level.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const CACHED = { isCached: true };

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
		apiFetch.mockReset();
		registry = createTestRegistry();
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
		editPostFields( id, { title: value }, options );
	}

	function editPostFields( id, edits, options ) {
		registry
			.dispatch( coreDataStore )
			.editEntityRecord( 'postType', 'post', id, edits, options );
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
		editTitle( 'H', CACHED );
		editTitle( 'He', CACHED );
		editTitle( 'Hel', CACHED );

		expect( countUndoLevels() ).toBe( 1 );
		expect( getRecord().title ).toBe( ORIGINAL.title );
	} );

	it( 'does not fold an edit into the level of an unrelated property', () => {
		editTitle( 'New Title', CACHED );
		edit( 'description', 'New Tagline', CACHED );
		editTitle( 'Newer Title', CACHED );

		expect( countUndoLevels() ).toBe( 3 );
	} );

	it.each( [
		[ 'no options', undefined ],
		[ '`isCached: false`', { isCached: false } ],
	] )(
		'starts a new level when a plain edit (%s) interrupts a run',
		( _label, options ) => {
			editTitle( 'New Title', CACHED );
			edit( 'description', 'New Tagline', options );
			editTitle( 'Newer Title', CACHED );

			expect( countUndoLevels() ).toBe( 3 );
		}
	);

	it( 'continues a run when the edited keys overlap', () => {
		editTitle( 'New Title', CACHED );
		registry
			.dispatch( coreDataStore )
			.editEntityRecord(
				'root',
				'site',
				undefined,
				{ title: 'Newer Title', description: 'New Tagline' },
				CACHED
			);

		expect( countUndoLevels() ).toBe( 1 );
	} );

	it( 'continues a run of block edits after the edit that opened it', () => {
		// `useEntityBlockEditor` sends `content` only with the edit that opens
		// a level, and `blocks` alone while typing.
		editPostFields( 1, { content: 'A', blocks: [ 'A' ] } );
		editPostFields( 1, { blocks: [ 'Ab' ] }, CACHED );
		editPostFields( 1, { blocks: [ 'Abc' ] }, CACHED );

		expect( countUndoLevels() ).toBe( 1 );
	} );

	it( 'does not fold block edits into the level of another entity', () => {
		editPostFields( 1, { content: 'A', blocks: [ 'A' ] } );
		editPostFields( 1, { blocks: [ 'Ab' ] }, CACHED );
		editTitle( 'New Title', CACHED );
		editPostFields( 1, { blocks: [ 'Abc' ] }, CACHED );

		registry.dispatch( coreDataStore ).undo();

		expect( getPost( 1 ).blocks ).toEqual( [ 'Ab' ] );
		expect( getRecord().title ).toBe( 'New Title' );
	} );

	it( 'starts a new level when the edited record changes', () => {
		editPost( 1, 'Edited First', CACHED );
		editPost( 2, 'Edited Second', CACHED );
		editPost( 1, 'Edited First Again', CACHED );

		expect( countUndoLevels() ).toBe( 3 );
	} );

	it( 'folds into the matching record and leaves the others alone', () => {
		editPost( 1, 'E', CACHED );
		editPost( 1, 'Ed', CACHED );
		editPost( 2, 'Edited Second', CACHED );

		registry.dispatch( coreDataStore ).undo();

		expect( getPost( 2 ).title ).toBe( 'Second Post' );
		expect( getPost( 1 ).title ).toBe( 'Ed' );
	} );

	it( 'starts a new level for a cached edit that does not continue a run', () => {
		editTitle( 'New Title' );
		edit( 'description', 'New Tagline', CACHED );

		expect( countUndoLevels() ).toBe( 2 );
	} );

	it( 'keeps pending redos on a cached edit that changes nothing', () => {
		editTitle( 'New Title', CACHED );
		registry.dispatch( coreDataStore ).undo();

		edit( 'description', ORIGINAL.description, CACHED );

		expect( registry.select( coreDataStore ).hasRedo() ).toBe( true );
	} );

	it( 'keeps a run open across an `undoIgnore` edit', () => {
		editTitle( 'H', CACHED );
		edit( 'description', 'Ignored Tagline', { undoIgnore: true } );
		editTitle( 'He', CACHED );

		expect( countUndoLevels() ).toBe( 1 );
	} );

	it( 'does not start a run on an edit that changes nothing', () => {
		edit( 'description', 'New Tagline' );
		// The Site Title block trims its value, so typing a trailing space
		// edits the title to the value it already has.
		editTitle( ORIGINAL.title, CACHED );
		editTitle( 'New Title', CACHED );

		registry.dispatch( coreDataStore ).undo();

		expect( getRecord().title ).toBe( ORIGINAL.title );
		expect( getRecord().description ).toBe( 'New Tagline' );
	} );

	it( 'does not end a run on an edit that changes nothing', () => {
		editTitle( 'H', CACHED );
		edit( 'description', ORIGINAL.description, CACHED );
		editTitle( 'He', CACHED );

		registry.dispatch( coreDataStore ).undo();

		expect( getRecord().title ).toBe( ORIGINAL.title );
		expect( registry.select( coreDataStore ).hasUndo() ).toBe( false );
	} );

	it( 'starts a new level when editing after an undo', () => {
		editTitle( 'H', CACHED );
		editTitle( 'He', CACHED );

		registry.dispatch( coreDataStore ).undo();
		expect( registry.select( coreDataStore ).hasRedo() ).toBe( true );

		editTitle( 'Ha', CACHED );

		// A staged edit does not drop pending redos, so a stale session would
		// leave a redo entry that no longer matches the history.
		expect( registry.select( coreDataStore ).hasRedo() ).toBe( false );
	} );

	it( 'starts a new level when editing after a redo', () => {
		editTitle( 'H', CACHED );
		registry.dispatch( coreDataStore ).__unstableCreateUndoLevel();
		editTitle( 'He', CACHED );

		registry.dispatch( coreDataStore ).undo();
		registry.dispatch( coreDataStore ).redo();

		editTitle( 'Hel', CACHED );

		expect( countUndoLevels() ).toBe( 3 );
	} );

	it( 'ends the run when `saveEntityRecord` is called directly', async () => {
		apiFetch.mockResolvedValue( { ...ORIGINAL } );

		editTitle( 'H', CACHED );
		await registry
			.dispatch( coreDataStore )
			.saveEntityRecord( 'root', 'site', { title: 'H' } );
		editTitle( 'He', CACHED );

		expect( countUndoLevels() ).toBe( 2 );
	} );

	it( 'ends the run when `saveEditedEntityRecord` is called', async () => {
		apiFetch.mockResolvedValue( { ...ORIGINAL } );

		editTitle( 'H', CACHED );
		await registry
			.dispatch( coreDataStore )
			.saveEditedEntityRecord( 'root', 'site' );
		editTitle( 'He', CACHED );

		expect( countUndoLevels() ).toBe( 2 );
	} );

	it( 'keeps the run open across an autosave', async () => {
		apiFetch.mockResolvedValue( { ...ORIGINAL } );

		editTitle( 'H', CACHED );
		await registry
			.dispatch( coreDataStore )
			.saveEntityRecord(
				'root',
				'site',
				{ title: 'H' },
				{ isAutosave: true }
			);
		editTitle( 'He', CACHED );

		expect( countUndoLevels() ).toBe( 1 );
	} );

	it( 'ends the run when edits are discarded', () => {
		editTitle( 'H', CACHED );
		registry
			.dispatch( coreDataStore )
			.clearEntityRecordEdits( 'root', 'site' );
		editTitle( 'He', CACHED );

		expect( countUndoLevels() ).toBe( 2 );
	} );

	it( 'ends the run on `__unstableCreateUndoLevel`', () => {
		editTitle( 'H', CACHED );
		registry.dispatch( coreDataStore ).__unstableCreateUndoLevel();
		editTitle( 'He', CACHED );

		expect( countUndoLevels() ).toBe( 2 );
	} );

	it( 'keeps pending redos when `__unstableCreateUndoLevel` follows an undo', () => {
		// An input's timer fires after the value changes, undo included.
		editTitle( 'H', CACHED );
		registry.dispatch( coreDataStore ).undo();
		registry.dispatch( coreDataStore ).__unstableCreateUndoLevel();

		expect( registry.select( coreDataStore ).hasRedo() ).toBe( true );
	} );

	it( 'keeps sessions separate between registries', () => {
		const otherRegistry = createTestRegistry();

		editTitle( 'H', CACHED );
		// A different key. Were the session shared, this would end the run.
		edit( 'description', 'New Tagline', CACHED, otherRegistry );
		editTitle( 'He', CACHED );

		expect( countUndoLevels() ).toBe( 1 );
		expect( countUndoLevels( otherRegistry ) ).toBe( 1 );
	} );
} );
