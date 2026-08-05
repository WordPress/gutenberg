import assert from 'node:assert/strict';

import {
	canonicalGenesisInput,
	genesisSyncId,
	mintSyncId,
} from '../sync-id.js';
import FROZEN from '../test-vectors/sync-id.json';

test( 'genesis matches every frozen cross-language vector', () => {
	for ( const vector of FROZEN.vectors ) {
		const revision = {
			postId: vector.postId,
			revisionId: vector.revisionId,
		};
		assert.equal(
			canonicalGenesisInput( revision, vector.path ),
			vector.canonicalInput
		);
		assert.equal( genesisSyncId( revision, vector.path ), vector.syncId );
	}
} );

test( 'genesis is deterministic across independent minters', () => {
	const revision = { postId: 12, revisionId: 40 };
	assert.equal(
		genesisSyncId( revision, [ 1, 2 ] ),
		genesisSyncId( { ...revision }, [ 1, 2 ] )
	);
} );

test( 'genesis distinguishes post, revision, and path', () => {
	const ids = new Set( [
		genesisSyncId( { postId: 1, revisionId: 1 }, [ 0 ] ),
		genesisSyncId( { postId: 1, revisionId: 2 }, [ 0 ] ),
		genesisSyncId( { postId: 2, revisionId: 1 }, [ 0 ] ),
		genesisSyncId( { postId: 1, revisionId: 1 }, [ 1 ] ),
		genesisSyncId( { postId: 1, revisionId: 1 }, [ 0, 0 ] ),
	] );
	assert.equal( ids.size, 5 );
} );

test( 'genesis rejects non-revision input', () => {
	assert.throws( () => genesisSyncId( { postId: 1 }, [ 0 ] ), TypeError );
	assert.throws(
		() => genesisSyncId( { postId: 1, revisionId: 1.5 }, [ 0 ] ),
		TypeError
	);
	assert.throws(
		() => genesisSyncId( { postId: 1, revisionId: 1 }, [ -1 ] ),
		TypeError
	);
	assert.throws(
		() => genesisSyncId( { postId: 1, revisionId: 1 }, 'no' ),
		TypeError
	);
} );

test( 'creation minting is unique per creation event', () => {
	const ids = new Set();
	for ( let i = 0; i < 1000; i++ ) {
		ids.add( mintSyncId() );
	}
	assert.equal( ids.size, 1000 );
} );

test( 'creation minting with a seeded RNG is deterministic', () => {
	const makeRng = () => {
		let state = 42;
		return () => {
			state = ( state * 1664525 + 1013904223 ) % 2 ** 32;
			return state / 2 ** 32;
		};
	};
	assert.equal( mintSyncId( makeRng() ), mintSyncId( makeRng() ) );
	const rng = makeRng();
	assert.notEqual( mintSyncId( rng ), mintSyncId( rng ) );
} );
