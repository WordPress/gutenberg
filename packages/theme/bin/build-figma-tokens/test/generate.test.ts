import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import { parse } from '@terrazzo/parser';
import config from '../../../terrazzo.config.ts';
import { generateFigmaFiles } from '../generate.ts';

describe( 'Figma border collection files', () => {
	let files: ReturnType< typeof generateFigmaFiles >;
	let border: Record<
		string,
		Record<
			string,
			{
				$description?: string;
				$extensions?: Record< string, unknown >;
			}
		>
	>;

	beforeAll( async () => {
		const sources = await Promise.all(
			config.tokens.map( async ( filename: URL ) => ( {
				filename,
				src: await readFile( filename, 'utf8' ),
			} ) )
		);
		const { resolver } = await parse( sources, { config } );
		files = generateFigmaFiles( resolver );
		border = JSON.parse(
			await readFile(
				new URL( '../../../tokens/border.json', import.meta.url ),
				'utf8'
			)
		)[ 'wpds-border' ];
	} );

	it( 'creates complete mode files with the original names, types, descriptions, and scopes', () => {
		expect( files.map( ( file ) => file.filename ) ).toEqual( [
			'radius/none.json',
			'radius/subtle.json',
			'radius/moderate.json',
			'radius/pronounced.json',
			'width/standard.json',
			'width/high-dpi.json',
		] );

		for ( const file of files ) {
			const group = file.filename.split( '/' )[ 0 ];
			const document = JSON.parse( file.contents );
			expect( Object.keys( document ) ).toEqual( [ 'wpds-border' ] );
			expect( Object.keys( document[ 'wpds-border' ] ) ).toEqual( [
				group,
			] );
			const tokens = document[ 'wpds-border' ][ group ];
			const names = Object.keys( border[ group ] ).filter(
				( name ) => ! name.startsWith( '$' )
			);
			expect( Object.keys( tokens ) ).toEqual( names );
			for ( const name of names ) {
				expect( tokens[ name ] ).toEqual( {
					$type: 'dimension',
					$value: { value: expect.any( Number ), unit: 'px' },
					$description: border[ group ][ name ].$description,
					$extensions: border[ group ][ name ].$extensions,
				} );
			}
		}
	} );
} );
