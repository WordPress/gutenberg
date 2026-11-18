import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const { validateCollection } = require( '../validate-collection.cjs' );

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

	it( 'accepts a normalized icon', async () => {
		await writeFile(
			path.join( iconLibraryDir, 'check.svg' ),
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n\t<path d="M4 12L10 18L20 6" />\n</svg>\n'
		);

		await expect(
			validateCollection( iconLibraryDir )
		).resolves.toBeUndefined();
	} );

	it( 'rejects an icon that is not normalized', async () => {
		await writeFile(
			path.join( iconLibraryDir, 'check.svg' ),
			'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n<path d="M4 12L10 18L20 6" stroke="#1E1E1E" stroke-width="1.5"/>\n</svg>\n'
		);

		await expect( validateCollection( iconLibraryDir ) ).rejects.toThrow(
			'is not normalized'
		);
	} );

	it( 'rejects an icon that cannot be normalized', async () => {
		await writeFile(
			path.join( iconLibraryDir, 'check.svg' ),
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" style="fill: none" stroke="currentColor" stroke-width="1.5">\n\t<path d="M4 12L10 18L20 6" stroke-width="2" />\n</svg>\n'
		);

		await expect( validateCollection( iconLibraryDir ) ).rejects.toThrow(
			'cannot normalize: stroke-width="2"'
		);
	} );

	describe( 'dashicons', () => {
		async function writeManifest( icons ) {
			await writeFile(
				path.join( fixtureDir, 'manifest.json' ),
				JSON.stringify(
					icons.map( ( icon ) => ( {
						filePath: `library/${ icon.slug }.svg`,
						...icon,
					} ) )
				)
			);
			for ( const { slug } of icons ) {
				await writeFile(
					path.join( iconLibraryDir, `${ slug }.svg` ),
					'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">\n\t<path d="M4 12L10 18L20 6" />\n</svg>\n'
				);
			}
		}

		it( 'accepts Dashicon class names on core-admin icons', async () => {
			await writeManifest( [
				{
					slug: 'check',
					collections: [ 'core', 'core-admin' ],
					dashicons: [ 'dashicons-yes', 'dashicons-yes-alt' ],
				},
				{
					slug: 'pin',
					collections: [ 'core-admin' ],
					dashicons: [ 'dashicons-admin-post' ],
				},
			] );

			await expect(
				validateCollection( iconLibraryDir )
			).resolves.toBeUndefined();
		} );

		it.each( [
			[ 'an empty array', [] ],
			[ 'a string', 'dashicons-yes' ],
			[ 'a name without the class prefix', [ 'yes' ] ],
			[ 'a repeated name', [ 'dashicons-yes', 'dashicons-yes' ] ],
		] )( 'rejects %s', async ( _, dashicons ) => {
			await writeManifest( [
				{
					slug: 'check',
					collections: [ 'core-admin' ],
					dashicons,
				},
			] );

			await expect(
				validateCollection( iconLibraryDir )
			).rejects.toThrow(
				"expected 'dashicons' to be a non-empty array of unique Dashicon class names"
			);
		} );

		it.each( [
			[ 'only in the core collection', [ 'core' ] ],
			[ 'in no collection', undefined ],
		] )( 'rejects them on an icon %s', async ( _, collections ) => {
			await writeManifest( [
				{
					slug: 'check',
					collections,
					dashicons: [ 'dashicons-yes' ],
				},
			] );

			await expect(
				validateCollection( iconLibraryDir )
			).rejects.toThrow(
				"'dashicons' is only allowed on icons in the 'core-admin' collection"
			);
		} );

		it( 'rejects a Dashicon replaced by more than one icon', async () => {
			await writeManifest( [
				{
					slug: 'check',
					collections: [ 'core-admin' ],
					dashicons: [ 'dashicons-yes' ],
				},
				{
					slug: 'published',
					collections: [ 'core-admin' ],
					dashicons: [ 'dashicons-yes-alt', 'dashicons-yes' ],
				},
			] );

			await expect(
				validateCollection( iconLibraryDir )
			).rejects.toThrow(
				"'dashicons-yes' is already replaced by icon 'check'"
			);
		} );
	} );
} );
