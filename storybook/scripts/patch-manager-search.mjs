/**
 * Patches Storybook manager runtime so sidebar search includes design system synonyms.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectUiStorySynonyms } from './collect-ui-story-synonyms.mjs';

const DESIGN_SYSTEM_SYNONYMS = collectUiStorySynonyms();

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const storybookRoot = resolve( __dirname, '..' );
const repoRoot = resolve( storybookRoot, '..' );

const SEARCH_ITEM_PATTERN =
	/var searchItem = \(item, ref\) => \(\{ \.\.\.item, refId: ref\.id, path: getPath\(item, ref\) \}\);/;

const SYNONYMS_BOOTSTRAP = `var DESIGN_SYSTEM_SYNONYMS = ${ JSON.stringify(
	DESIGN_SYSTEM_SYNONYMS
) };`;

const SEARCH_ITEM_REPLACEMENT = `${ SYNONYMS_BOOTSTRAP }
var getDesignSystemSearchSynonyms = (item) => {
  if (!item?.title) {
    return "";
  }
  const synonyms = DESIGN_SYSTEM_SYNONYMS[item.title];
  return synonyms ? synonyms.join(" ") : "";
};
var searchItem = (item, ref) => ({
  ...item,
  refId: ref.id,
  path: getPath(item, ref),
  synonyms: getDesignSystemSearchSynonyms(item),
});`;

const FUSE_KEYS_PATTERN =
	/keys: \[\s*\{ name: "name", weight: 0\.7 \},\s*\{ name: "path", weight: 0\.3 \}\s*\]/;

const FUSE_KEYS_REPLACEMENT = `keys: [
    { name: "name", weight: 0.7 },
    { name: "path", weight: 0.3 },
    { name: "synonyms", weight: 0.35 },
  ]`;

function patchRuntime( filePath ) {
	let code;

	try {
		code = readFileSync( filePath, 'utf8' );
	} catch {
		return false;
	}

	if ( code.includes( 'getDesignSystemSearchSynonyms' ) ) {
		return true;
	}

	if ( ! SEARCH_ITEM_PATTERN.test( code ) ) {
		return false;
	}

	const patched = code
		.replace( SEARCH_ITEM_PATTERN, SEARCH_ITEM_REPLACEMENT )
		.replace( FUSE_KEYS_PATTERN, FUSE_KEYS_REPLACEMENT );

	writeFileSync( filePath, patched );
	return true;
}

const targets = [
	join( repoRoot, 'node_modules/storybook/dist/manager/runtime.js' ),
	process.argv[ 2 ] && resolve( process.argv[ 2 ], 'sb-manager/runtime.js' ),
].filter( Boolean );

let patchedAny = false;

for ( const target of targets ) {
	if ( patchRuntime( target ) ) {
		patchedAny = true;
	}
}

if ( ! patchedAny ) {
	console.warn(
		'[patch-manager-search] No Storybook manager runtime was patched.'
	);
}
