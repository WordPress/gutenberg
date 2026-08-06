import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const {
	isStrokeBasedSvg,
	validateCollection,
} = require( '../validate-collection.cjs' );

describe( 'isStrokeBasedSvg', () => {
	it.each( [
		'<svg style="fill: none">',
		"<svg style='fill: none'>",
		'<svg style="fill:none">',
		'<svg style="fill: none; ">',
	] )( 'recognizes a supported fill-none style in %s', ( svg ) => {
		expect( isStrokeBasedSvg( svg ) ).toBe( true );
	} );

	it( 'ignores fill-none styles on child elements', () => {
		expect(
			isStrokeBasedSvg( '<svg><path style="fill: none" /></svg>' )
		).toBe( false );
	} );
} );

describe( 'validateCollection', () => {
	let fixtureDir;
	let iconLibraryDir;

	beforeEach( async () => {
		fixtureDir = await mkdtemp(
			path.join( tmpdir(), 'icons-collection-' )
		);
		iconLibraryDir = path.join( fixtureDir, 'library' );
		await mkdir( iconLibraryDir );
		await writeFile(
			path.join( fixtureDir, 'manifest.json' ),
			JSON.stringify( [
				{ slug: 'check', filePath: 'library/check.svg' },
			] )
		);
	} );

	afterEach( async () => {
		await rm( fixtureDir, { recursive: true, force: true } );
	} );

	it( 'accepts stroke-based library icons without a vector effect', async () => {
		await writeFile(
			path.join( iconLibraryDir, 'check.svg' ),
			'<svg viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5"><path d="M4 12L10 18L20 6" /></svg>'
		);

		await expect(
			validateCollection( iconLibraryDir )
		).resolves.toBeUndefined();
	} );

	it.each( [
		'<svg viewBox="0 0 24 24" style="fill: none" stroke="currentColor" vector-effect="non-scaling-stroke"><path d="M4 12L10 18L20 6" /></svg>',
		'<svg viewBox="0 0 24 24" style="fill: none" stroke="currentColor"><path d="M4 12L10 18L20 6" vector-effect="non-scaling-stroke" /></svg>',
		'<svg viewBox="0 0 24 24" style="fill: none" stroke="currentColor"><path d="M4 12L10 18L20 6" vector-effect=\'non-scaling-stroke\' /></svg>',
	] )(
		'rejects library icons that prevent stroke scaling: %s',
		async ( svg ) => {
			await writeFile( path.join( iconLibraryDir, 'check.svg' ), svg );

			await expect(
				validateCollection( iconLibraryDir )
			).rejects.toThrow(
				'must omit vector-effect so its stroke width scales with its size'
			);
		}
	);
} );
