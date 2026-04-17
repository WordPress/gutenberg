import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, build } from '@terrazzo/parser';
import config from '../../terrazzo.config';

const sources = await Promise.all(
	config.tokens.map( async ( tokenUrl: URL ) => ( {
		filename: tokenUrl,
		src: await readFile( fileURLToPath( tokenUrl ), 'utf8' ),
	} ) )
);

const {
	tokens: parsedTokens,
	sources: parsedSources,
	resolver,
} = await parse( sources, {
	config,
	skipLint: true,
} );

// Temporary workaround for Terrazzo bug where `alphabetize: false` leaves token
// map keys in JSON Pointer form (e.g. `#/foo/bar`) while `aliasOf` references
// remain dot-delimited (e.g. `foo.bar`), breaking alias lookups. Transforms the
// map keys using the already-normalized `token.id`.
//
// See: https://github.com/terrazzoapp/terrazzo/issues/734
const tokens = Object.fromEntries(
	Object.values( parsedTokens ).map( ( token ) => [ token.id, token ] )
);

const { outputFiles } = await build( tokens, {
	sources: parsedSources,
	config,
	resolver,
} );

const outDir = fileURLToPath( config.outDir );

for ( const file of outputFiles ) {
	const filePath = resolve( outDir, file.filename );
	await mkdir( dirname( filePath ), { recursive: true } );
	await writeFile( filePath, file.contents );
}
