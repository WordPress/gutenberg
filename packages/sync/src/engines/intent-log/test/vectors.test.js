/**
 * JS-side replay of the frozen cross-language planner vectors.
 *
 * The PHP twin has always replayed `test-vectors/planner.json`; without this
 * mirror, regenerating the file rewrote the cross-language contract with
 * nothing on the JS side objecting — a planner regression could ship inside
 * a "regeneration" commit unnoticed. Replaying here pins the frozen file
 * against the JS engine too: both twins now answer to the same artifact.
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { canonicalJson } from '../document.js';
import { createServer, serverDocAt, serverIngestBatch } from '../rebase.js';
import { makeGenesisDoc } from '../simulator.js';

const vectors = JSON.parse(
	readFileSync(
		join(
			dirname( fileURLToPath( import.meta.url ) ),
			'..',
			'test-vectors',
			'planner.json'
		),
		'utf8'
	)
);

describe( 'frozen planner vectors (JS replay)', () => {
	it( 'has cases', () => {
		assert.ok( vectors.cases.length >= 10 );
	} );

	for ( const vectorCase of vectors.cases ) {
		it( `reproduces: ${ vectorCase.name }`, () => {
			const server = createServer(
				makeGenesisDoc( {
					postId: vectorCase.genesis.postId,
					revisionId: vectorCase.genesis.revisionId,
				} )
			);
			for ( const batch of vectorCase.batches ) {
				serverIngestBatch( server, batch );
			}

			assert.deepEqual(
				Object.fromEntries( server.dispositions ),
				vectorCase.expected.dispositions,
				'dispositions diverged'
			);
			assert.deepEqual(
				server.proposals.map( ( proposal ) => ( {
					intentId: proposal.intent.intentId,
					actorId: proposal.actorId,
					reason: proposal.reason,
				} ) ),
				vectorCase.expected.proposals,
				'proposal lane diverged'
			);
			assert.deepEqual(
				server.log,
				vectorCase.expected.log,
				'accepted log diverged'
			);
			assert.deepEqual(
				JSON.parse(
					canonicalJson( serverDocAt( server, server.log.length ) )
				),
				vectorCase.expected.finalDoc,
				'final document diverged'
			);
		} );
	}
} );
