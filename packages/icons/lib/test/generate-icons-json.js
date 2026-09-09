import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
const require = createRequire( import.meta.url );
const {
	buildIconsJson,
	generateIconsJson,
} = require( '../generate-icons-json.cjs' );

describe( 'buildIconsJson', () => {
	it( 'maps each manifest slug to the SVG content at its filePath', () => {
		const manifest = [
			{
				slug: 'arrow-up',
				label: 'Arrow Up',
				filePath: 'library/arrow-up.svg',
			},
			{
				slug: 'check',
				label: 'Check',
				filePath: 'library/check.svg',
			},
		];
		const svgContentsByPath = {
			'library/arrow-up.svg': '<svg><path d="up" /></svg>\n',
			'library/check.svg': '  <svg><path d="check" /></svg>  ',
		};

		const icons = buildIconsJson( manifest, svgContentsByPath );

		expect( icons ).toEqual( {
			'arrow-up': '<svg><path d="up" /></svg>',
			check: '<svg><path d="check" /></svg>',
		} );
	} );

	it( 'trims surrounding whitespace from the SVG content', () => {
		const icons = buildIconsJson(
			[ { slug: 'x', label: 'X', filePath: 'library/x.svg' } ],
			{ 'library/x.svg': '\n\t<svg /> ' }
		);

		expect( icons.x ).toBe( '<svg />' );
	} );
} );

describe( 'generateIconsJson', () => {
	it( 'writes a JSON file mapping icon slugs to SVG markup', async () => {
		const tempDir = await mkdtemp(
			path.join( tmpdir(), 'gutenberg-icons-' )
		);
		try {
			await mkdir( path.join( tempDir, 'library' ) );
			await writeFile(
				path.join( tempDir, 'manifest.json' ),
				JSON.stringify( [
					{
						slug: 'arrow-up',
						label: 'Arrow Up',
						filePath: 'library/arrow-up.svg',
					},
					{
						slug: 'check',
						label: 'Check',
						filePath: 'library/check.svg',
					},
				] )
			);
			await writeFile(
				path.join( tempDir, 'library', 'arrow-up.svg' ),
				'<svg><path d="up" /></svg>\n'
			);
			await writeFile(
				path.join( tempDir, 'library', 'check.svg' ),
				'<svg><path d="check" /></svg>\n'
			);

			const outputPath = path.join( tempDir, 'icons.json' );
			await generateIconsJson( {
				manifestPath: path.join( tempDir, 'manifest.json' ),
				outputPath,
			} );

			await expect( readFile( outputPath, 'utf8' ) ).resolves.toBe(
				'{\n' +
					'\t"arrow-up": "<svg><path d=\\"up\\" /></svg>",\n' +
					'\t"check": "<svg><path d=\\"check\\" /></svg>"\n' +
					'}\n'
			);
		} finally {
			await rm( tempDir, { force: true, recursive: true } );
		}
	} );
} );
