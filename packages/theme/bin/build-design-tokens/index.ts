import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, build } from '@terrazzo/parser';
import config from '../../terrazzo.config';
import { getLegacyWpComponentsStaticColorAliasEntries } from '../../src/legacy-color-aliases';

const DESIGN_TOKEN_FALLBACKS_FILENAME = 'js/design-token-fallbacks.mjs';

type OutputFile = {
	filename: string;
	contents: string | Buffer;
};

function getDesignTokenFallbacks( outputFiles: OutputFile[] ) {
	const fallbackOutputFile = outputFiles.find(
		( file ) => file.filename === DESIGN_TOKEN_FALLBACKS_FILENAME
	);

	if ( ! fallbackOutputFile ) {
		throw new Error(
			`Expected ${ DESIGN_TOKEN_FALLBACKS_FILENAME } to be generated before legacy color aliases.`
		);
	}

	const fallbackContents = fallbackOutputFile.contents.toString();
	const match = fallbackContents.match(
		/export default (?<fallbacks>{[\s\S]*})\n?$/
	);

	if ( ! match?.groups?.fallbacks ) {
		throw new Error(
			`Could not parse generated design token fallbacks from ${ DESIGN_TOKEN_FALLBACKS_FILENAME }.`
		);
	}

	return JSON.parse( match.groups.fallbacks ) as Record< string, string >;
}

function legacyWpComponentsAliasesCSS(
	designTokenFallbacks: Record< string, string >
) {
	return `
/* Default legacy @wordpress/components color alias compatibility baseline. */
:where(:root) {
${ getLegacyWpComponentsStaticColorAliasEntries( designTokenFallbacks )
	.map( ( [ property, value ] ) => `\t${ property }: ${ value };` )
	.join( '\n' ) }
}
`;
}

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
const designTokenFallbacks = getDesignTokenFallbacks( outputFiles );

for ( const file of outputFiles ) {
	const filePath = resolve( outDir, file.filename );
	const contents =
		file.filename === 'css/design-tokens.css'
			? `${ file.contents }\n${ legacyWpComponentsAliasesCSS(
					designTokenFallbacks
			  ) }`
			: file.contents;
	await mkdir( dirname( filePath ), { recursive: true } );
	await writeFile( filePath, contents );
}
