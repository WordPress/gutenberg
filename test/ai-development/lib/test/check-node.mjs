import assert from 'node:assert/strict';
import test from 'node:test';
import { supportsNode } from '../check-node.mjs';

test( 'rejects Node versions below the package minimum', () => {
	assert.equal( supportsNode( '20.20.2' ), false );
	assert.equal( supportsNode( '22.21.1' ), false );
} );

test( 'accepts the package minimum and later Node versions', () => {
	assert.equal( supportsNode( '22.22.0' ), true );
	assert.equal( supportsNode( '24.0.0' ), true );
} );
