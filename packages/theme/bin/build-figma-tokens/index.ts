import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@terrazzo/parser';
import config from '../../terrazzo.config.ts';
import { generateFigmaFiles } from './generate.ts';

const sources = await Promise.all(
	config.tokens.map( async ( filename: URL ) => ( {
		filename,
		src: await readFile( filename, 'utf8' ),
	} ) )
);
const { resolver } = await parse( sources, { config } );

for ( const file of generateFigmaFiles( resolver ) ) {
	const filename = new URL(
		`../../prebuilt/figma/${ file.filename }`,
		import.meta.url
	);
	await mkdir( dirname( fileURLToPath( filename ) ), { recursive: true } );
	await writeFile( filename, file.contents );
}
