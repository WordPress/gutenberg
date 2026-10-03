import { readFile } from 'node:fs/promises';
import { beforeAll, describe, expect, it } from 'vitest';
import { defineConfig, parse } from '@terrazzo/parser';
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

	it( 'keeps radius and width modes independent', () => {
		const values = Object.fromEntries(
			files.map( ( file ) => {
				const group = file.filename.split( '/' )[ 0 ];
				const tokens: Record< string, { $value: { value: number } } > =
					JSON.parse( file.contents )[ 'wpds-border' ][ group ];
				return [
					file.filename,
					Object.values( tokens ).map(
						( token ) => token.$value.value
					),
				];
			} )
		);
		expect( values ).toEqual( {
			'radius/none.json': [ 0, 0, 0, 0, 0 ],
			'radius/subtle.json': [ 1, 2, 4, 8, 12 ],
			'radius/moderate.json': [ 6, 8, 12, 16, 20 ],
			'radius/pronounced.json': [ 18, 20, 22, 24, 26 ],
			'width/standard.json': [ 1, 2, 4, 8, 2 ],
			'width/high-dpi.json': [ 1, 2, 4, 8, 1.5 ],
		} );
	} );

	it( 'preserves token aliases within a collection', async () => {
		const { resolver } = await parse(
			[
				{
					filename: new URL(
						'aliases.resolver.json',
						import.meta.url
					),
					src: {
						version: '2025.10',
						sets: {
							base: {
								sources: [
									{
										'wpds-border': {
											$type: 'dimension',
											radius: {
												sm: {
													$value: {
														value: 2,
														unit: 'px',
													},
												},
												control: {
													$value: '{wpds-border.radius.sm}',
												},
											},
										},
									},
								],
							},
						},
						modifiers: {
							'corner-radius': {
								default: 'subtle',
								contexts: { subtle: [] },
							},
							'pixel-density': {
								default: 'standard',
								contexts: { standard: [] },
							},
						},
						resolutionOrder: [
							{ $ref: '#/sets/base' },
							{ $ref: '#/modifiers/corner-radius' },
							{ $ref: '#/modifiers/pixel-density' },
						],
					},
				},
			],
			{
				config: defineConfig(
					{},
					{ cwd: new URL( './', import.meta.url ) }
				),
			}
		);
		const file = generateFigmaFiles( resolver ).find(
			( candidate ) => candidate.filename === 'radius/subtle.json'
		)!;
		expect(
			JSON.parse( file.contents )[ 'wpds-border' ].radius.control
		).toEqual( {
			$type: 'dimension',
			$value: '{wpds-border.radius.sm}',
		} );
	} );
} );
