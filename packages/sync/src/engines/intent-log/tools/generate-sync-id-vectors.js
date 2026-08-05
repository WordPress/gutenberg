/**
 * Regenerates test-vectors/sync-id.json from the reference implementation.
 * The vectors are FROZEN once committed: regeneration is only legitimate if
 * the spec itself changes, and any change must be ported to every other
 * implementation (PHP) in the same change set.
 *
 * Usage: node tools/generate-sync-id-vectors.js > test-vectors/sync-id.json
 */

import { canonicalGenesisInput, genesisSyncId } from '../sync-id.js';

const CASES = [
	{ revision: { postId: 1, revisionId: 1 }, path: [] },
	{ revision: { postId: 1, revisionId: 1 }, path: [ 0 ] },
	{ revision: { postId: 1, revisionId: 1 }, path: [ 1 ] },
	{ revision: { postId: 1, revisionId: 1 }, path: [ 0, 0 ] },
	{ revision: { postId: 1, revisionId: 1 }, path: [ 0, 1, 2 ] },
	{ revision: { postId: 1, revisionId: 2 }, path: [ 0 ] },
	{ revision: { postId: 2, revisionId: 1 }, path: [ 0 ] },
	{ revision: { postId: 123456789, revisionId: 987654321 }, path: [ 42 ] },
	{ revision: { postId: 0, revisionId: 0 }, path: [ 0 ] },
	// Path ambiguity guards: [ 2 ] vs [ 0, 2 ] vs [ 0, 2, 0 ] must differ.
	{ revision: { postId: 7, revisionId: 3 }, path: [ 2 ] },
	{ revision: { postId: 7, revisionId: 3 }, path: [ 0, 2 ] },
	{ revision: { postId: 7, revisionId: 3 }, path: [ 0, 2, 0 ] },
	// Deep nesting.
	{
		revision: { postId: 99, revisionId: 100 },
		path: [ 3, 1, 4, 1, 5, 9, 2, 6 ],
	},
];

const vectors = CASES.map( ( { revision, path } ) => ( {
	postId: revision.postId,
	revisionId: revision.revisionId,
	path,
	canonicalInput: canonicalGenesisInput( revision, path ),
	syncId: genesisSyncId( revision, path ),
} ) );

process.stdout.write(
	JSON.stringify(
		{
			description:
				'Frozen cross-language vectors for the genesis syncId function: base64url(sha256(utf8(canonicalInput))[0..16)). Every implementation must reproduce these exactly.',
			hash: 'sha256, first 16 bytes, base64url (unpadded)',
			vectors,
		},
		null,
		'\t'
	) + '\n'
);
