import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import { parse, type Resolver } from '@terrazzo/parser';
import config from '../../../terrazzo.config.ts';
import { generateFigmaFiles } from '../generate.ts';

describe( 'Figma collection files', () => {
	let resolver: Resolver;
	let originalTokens: string;
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
		( { resolver } = await parse( sources, { config } ) );
		originalTokens = JSON.stringify(
			resolver.apply( {}, { resolveAliases: false } )
		);
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
			'typography/typography.json',
		] );

		for ( const file of files.filter(
			( { filename } ) => ! filename.startsWith( 'typography/' )
		) ) {
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

	it( 'exports single font families and numeric weights with per-token scopes', () => {
		const file = files.find(
			( { filename } ) => filename === 'typography/typography.json'
		);
		expect( file ).toBeDefined();
		const typography = JSON.parse( file!.contents )[ 'wpds-typography' ];
		for ( const [ name, family ] of Object.entries( {
			heading: 'SF Pro',
			body: 'SF Pro',
			mono: 'Menlo',
		} ) ) {
			expect( typography[ 'font-family' ][ name ] ).toMatchObject( {
				$type: 'fontFamily',
				$value: family,
				$extensions: { 'com.figma.scopes': [ 'FONT_FAMILY' ] },
			} );
		}
		for ( const [ name, weight ] of Object.entries( {
			default: 400,
			emphasis: 600,
		} ) ) {
			expect( typography[ 'font-weight' ][ name ] ).toMatchObject( {
				$type: 'number',
				$value: weight,
				$extensions: { 'com.figma.scopes': [ 'FONT_STYLE' ] },
			} );
		}
	} );

	it( 'preserves all typography names, dimensions, and descriptions', async () => {
		const file = files.find(
			( { filename } ) => filename === 'typography/typography.json'
		);
		expect( file ).toBeDefined();
		const typography = JSON.parse( file!.contents )[ 'wpds-typography' ];
		const source = JSON.parse(
			await readFile(
				new URL( '../../../tokens/typography.json', import.meta.url ),
				'utf8'
			)
		)[ 'wpds-typography' ];
		expect( Object.keys( typography ) ).toEqual( Object.keys( source ) );
		for ( const group of Object.keys( source ) ) {
			const names = Object.keys( source[ group ] ).filter(
				( name ) => ! name.startsWith( '$' )
			);
			expect( Object.keys( typography[ group ] ) ).toEqual( names );
			for ( const name of names ) {
				expect( typography[ group ][ name ].$description ).toBe(
					source[ group ][ name ].$description
				);
			}
		}
		for ( const [ group, scope ] of [
			[ 'font-size', 'FONT_SIZE' ],
			[ 'line-height', 'LINE_HEIGHT' ],
		] ) {
			for ( const name of Object.keys( typography[ group ] ) ) {
				expect( typography[ group ][ name ] ).toMatchObject( {
					$type: 'dimension',
					$value: source[ group ][ name ].$value,
					$extensions: { 'com.figma.scopes': [ scope ] },
				} );
			}
		}
	} );

	it( 'does not change the canonical resolver values or metadata', () => {
		expect(
			JSON.stringify( resolver.apply( {}, { resolveAliases: false } ) )
		).toBe( originalTokens );
	} );
} );
