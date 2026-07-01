import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, build } from '@terrazzo/parser';
import config from '../../terrazzo.config';

const legacyWpComponentsAliasesCSS = `
/* Legacy @wordpress/components color aliases. */
:root {
\t--wp-components-color-accent: var(--wp-admin-theme-color, #3858e9);
\t--wp-components-color-accent-darker-10: var(--wp-admin-theme-color-darker-10, #2145e6);
\t--wp-components-color-accent-darker-20: var(--wp-admin-theme-color-darker-20, #183ad6);
\t--wp-components-color-accent-inverted: var(--wpds-color-foreground-interactive-brand-strong);
\t--wp-components-color-background: var(--wpds-color-background-surface-neutral-strong);
\t--wp-components-color-foreground: var(--wpds-color-foreground-content-neutral);
\t--wp-components-color-foreground-inverted: var(--wpds-color-background-surface-neutral);
\t--wp-components-color-gray-100: var(--wpds-color-background-surface-neutral);
\t--wp-components-color-gray-200: var(--wpds-color-stroke-surface-neutral);
\t--wp-components-color-gray-300: var(--wpds-color-stroke-surface-neutral);
\t--wp-components-color-gray-400: var(--wpds-color-stroke-interactive-neutral);
\t--wp-components-color-gray-600: var(--wpds-color-stroke-interactive-neutral);
\t--wp-components-color-gray-700: var(--wpds-color-foreground-content-neutral-weak);
\t--wp-components-color-gray-800: var(--wpds-color-foreground-content-neutral);
}
`;

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
	const contents =
		file.filename === 'css/design-tokens.css'
			? `${ file.contents }\n${ legacyWpComponentsAliasesCSS }`
			: file.contents;
	await mkdir( dirname( filePath ), { recursive: true } );
	await writeFile( filePath, contents );
}
