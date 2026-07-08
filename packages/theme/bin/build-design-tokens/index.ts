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

// Append the hand-authored `@font-face` rules that back the synthetic font
// families referenced by the typography tokens, so they always ship in the
// same stylesheet as the tokens that reference them regardless of how
// `design-tokens.css` is loaded.
//
// TODO: Ideally this should happen in Terrazzo itself during the build process.
// Terrazzo's `permutations[].prepare()` hook on the CSS plugin is a perfect fit
// for this, but it is mutually exclusive with `modeSelectors`/`baseSelector`
// APIs, so this should be done as part of the work to migrate to the newer API.
const fontFacesCSS = await readFile(
	new URL( '../../src/font-faces.css', import.meta.url ),
	'utf8'
);

for ( const file of outputFiles ) {
	const filePath = resolve( outDir, file.filename );
	await mkdir( dirname( filePath ), { recursive: true } );
	const contents =
		file.filename === 'css/design-tokens.css'
			? `${ file.contents.toString() }\n${ fontFacesCSS }`
			: file.contents;
	await writeFile( filePath, contents );
}
