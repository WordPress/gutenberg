/**
 * Checks the read assertions in `../reads.js` without spending model calls.
 *
 * These are the cases the naive check got wrong — a path named but not read, a
 * read that was refused, a read that stopped early — so they are worth holding
 * still. An assertion is a plain function, so each is a recorded set of tool
 * calls and an expected verdict.
 *
 *   npm run test:utils
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { assertRead, assertNotRead } from '../index.js';
import { sourceRoot } from '../../lib/paths.js';

const REFERENCE = '.agents/skills/testing/references/e2e.md';
const CONTENTS = fs.readFileSync( path.join( sourceRoot, REFERENCE ), 'utf8' );
const LINES = CONTENTS.split( '\n' );

// What the agent runs in the workspace, where skills are generated into
// `.claude/skills` rather than read from `.agents/skills`.
const command = ( text ) => ( {
	name: 'Bash',
	input: { command: text },
} );

const call = ( text, output, isError = false ) => ( {
	...command( text ),
	output,
	is_error: isError,
} );

const workspacePath = REFERENCE.replace( '.agents/', '.claude/' );

/**
 * Runs an assertion the way Promptfoo would.
 *
 * @param {Object}   assertion Assertion under test.
 * @param {Object[]} toolCalls Calls the agent is recorded as having made.
 * @return {Object} The verdict.
 */
function grade( assertion, toolCalls ) {
	return assertion.value( null, { metadata: { toolCalls } } );
}

test( 'a file read through counts as read', () => {
	const verdict = grade( assertRead( REFERENCE, 'read' ), [
		call( `cat ${ workspacePath }`, CONTENTS ),
	] );

	assert.equal( verdict.pass, true, verdict.reason );
	assert.equal( verdict.score, 1 );
} );

test( 'a file read in pieces counts as read', () => {
	const verdict = grade( assertRead( REFERENCE, 'read' ), [
		call(
			`sed -n 1,12p ${ workspacePath }`,
			LINES.slice( 0, 12 ).join( '\n' )
		),
		call(
			`sed -n 13,99p ${ workspacePath }`,
			LINES.slice( 12 ).join( '\n' )
		),
	] );

	assert.equal( verdict.pass, true, verdict.reason );
} );

test( 'a file read through a glob counts as read', () => {
	const verdict = grade( assertRead( REFERENCE, 'read' ), [
		call( 'cat .claude/skills/testing/references/*.md', CONTENTS ),
	] );

	assert.equal( verdict.pass, true, verdict.reason );
} );

test( 'reading only the top does not count as read', () => {
	const verdict = grade( assertRead( REFERENCE, 'read' ), [
		call( `head -6 ${ workspacePath }`, LINES.slice( 0, 6 ).join( '\n' ) ),
	] );

	// Scored between the two, so a skim is distinguishable from ignoring it.
	assert.equal( verdict.pass, false );
	assert.ok( verdict.score > 0 && verdict.score < 1, verdict.reason );
} );

test( 'grepping one line does not count as read', () => {
	const verdict = grade( assertRead( REFERENCE, 'read' ), [
		call( `grep Routing ${ workspacePath }`, '## Routing' ),
	] );

	assert.equal( verdict.pass, false );
} );

test( 'listing the path does not count as read', () => {
	const verdict = grade( assertRead( REFERENCE, 'read' ), [
		call(
			`ls -la ${ workspacePath }`,
			`-rw-r--r-- 1 900 ${ workspacePath }`
		),
	] );

	assert.equal( verdict.pass, false );
} );

test( 'a refused read does not count as read', () => {
	const verdict = grade( assertRead( REFERENCE, 'read' ), [
		call( `cat ${ workspacePath }`, 'Operation not permitted', true ),
	] );

	assert.equal( verdict.pass, false );
	assert.equal( verdict.score, 0 );
	assert.match( verdict.reason, /failed/ );
} );

test( 'a successful relative read recovers from a refused full-path read', () => {
	const verdict = grade( assertRead( REFERENCE, 'read' ), [
		call( `cat ${ workspacePath }`, 'Operation not permitted', true ),
		call( 'cd .claude/skills/testing/references && cat e2e.md', CONTENTS ),
	] );

	assert.equal( verdict.pass, true, verdict.reason );
	assert.equal( verdict.score, 1 );
} );

test( 'never opening the file does not count as read', () => {
	const verdict = grade( assertRead( REFERENCE, 'read' ), [
		call( 'ls test/e2e/specs', 'paragraph.spec.js' ),
	] );

	assert.equal( verdict.pass, false );
	assert.equal( verdict.score, 0 );
	assert.match( verdict.reason, /Never opened/ );
} );

test( 'not reading a file counts as skipped', () => {
	const verdict = grade( assertNotRead( REFERENCE, 'skipped' ), [
		call( 'ls test/e2e/specs', 'paragraph.spec.js' ),
	] );

	assert.equal( verdict.pass, true, verdict.reason );
} );

test( 'naming a file without reading it counts as skipped', () => {
	const verdict = grade( assertNotRead( REFERENCE, 'skipped' ), [
		call(
			`ls -la ${ workspacePath }`,
			`-rw-r--r-- 1 900 ${ workspacePath }`
		),
	] );

	assert.equal( verdict.pass, true, verdict.reason );
} );

test( 'reading a file it should have skipped fails', () => {
	const verdict = grade( assertNotRead( REFERENCE, 'skipped' ), [
		call( `cat ${ workspacePath }`, CONTENTS ),
	] );

	assert.equal( verdict.pass, false );
	assert.match( verdict.reason, /Read/ );
} );

test( 'content returned by a failed call still fails the skipped check', () => {
	// `cat e2e.md; false` returns the contents and a non-zero exit — a read
	// all the same, so an error flag must not hide it.
	const verdict = grade( assertNotRead( REFERENCE, 'skipped' ), [
		call( `cat ${ workspacePath }; false`, CONTENTS, true ),
	] );

	assert.equal( verdict.pass, false );
	assert.match( verdict.reason, /Read/ );
} );

test( 'reading a file after changing directory fails the skipped check', () => {
	const verdict = grade( assertNotRead( REFERENCE, 'skipped' ), [
		call( 'cd .claude/skills/testing/references && cat e2e.md', CONTENTS ),
	] );

	assert.equal( verdict.pass, false );
	assert.match( verdict.reason, /Read/ );
} );
