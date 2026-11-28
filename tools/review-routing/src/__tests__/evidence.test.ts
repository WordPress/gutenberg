import { describe, expect, it } from 'vitest';
import {
	BUDGET,
	buildEvidence,
	compactPatch,
	stripComments,
	truncate,
} from '../evidence.ts';
import type { PullRequestFile } from '../github.ts';

function file( filename: string, patch?: string ): PullRequestFile {
	return { filename, status: 'modified', additions: 1, deletions: 1, patch };
}

describe( 'compactPatch', () => {
	it( 'keeps hunk headers and changed lines, and drops context', () => {
		expect(
			compactPatch(
				'@@ -1,3 +1,3 @@ function a()\n context\n-old\n+new\n context'
			)
		).toBe( '@@ -1,3 +1,3 @@ function a()\n-old\n+new' );
	} );
} );

describe( 'stripComments', () => {
	it( 'removes template comments and the blank lines they leave', () => {
		expect(
			stripComments( '## What?\n<!-- Explain -->\n\n\n\nA fix.' )
		).toBe( '## What?\n\nA fix.' );
	} );
} );

describe( 'truncate', () => {
	it( 'leaves short text alone', () => {
		expect( truncate( 'abc', 10 ) ).toBe( 'abc' );
	} );

	it( 'cuts at a line break and marks the cut', () => {
		expect( truncate( 'one\ntwo\nthree', 9 ) ).toBe(
			'one\ntwo\n[trimmed]'
		);
	} );
} );

describe( 'buildEvidence', () => {
	it( 'lists a generated file, but leaves out its diff', () => {
		const { state, stats } = buildEvidence(
			{
				title: 'Update packages',
				body: '',
				labels: [],
				files: [
					file( 'package-lock.json', '@@ -1 +1 @@\n-a\n+b' ),
					file( 'packages/ui/src/button.tsx', '@@ -1 +1 @@\n-x\n+y' ),
				],
			},
			new Set( [ 'package-lock.json' ] )
		);

		expect( state ).toContain(
			'- modified package-lock.json (+1 -1) [generated]'
		);
		expect( state ).not.toContain( '### package-lock.json' );
		expect( state ).toContain(
			'### packages/ui/src/button.tsx\n@@ -1 +1 @@\n-x\n+y'
		);
		expect( stats.generated ).toBe( 1 );
	} );

	it( 'trims a large diff and leaves out files past the budget', () => {
		const large = `@@ -1 +1 @@\n${ '+line\n'.repeat( BUDGET.perFile ) }`;
		const files = Array.from(
			{ length: Math.ceil( BUDGET.diff / BUDGET.perFile ) + 3 },
			( _, index ) => file( `file-${ index }.ts`, large )
		);

		const { stats } = buildEvidence(
			{
				title: 'Large change',
				body: '',
				labels: [],
				files,
			},
			new Set()
		);

		expect( stats.trimmed ).toBeGreaterThan( 0 );
		expect( stats.omitted ).toBeGreaterThan( 0 );
		expect( stats.characters ).toBeLessThan(
			BUDGET.description + BUDGET.fileList + BUDGET.diff + 1000
		);
	} );
} );
