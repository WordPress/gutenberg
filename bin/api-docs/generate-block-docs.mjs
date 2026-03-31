/**
 * Per-block detail page generator.
 *
 * Generates one Markdown reference page per core block under
 * docs/reference-guides/core-blocks/. Each page covers attributes,
 * supports, context, styles, selectors, and block markup.
 *
 * The summary page (core-blocks.md) is still generated separately
 * by gen-block-lib-list.js via the docs:blocks npm script.
 *
 * Reads from  : packages/block-library/src/{block}/block.json
 * Publishes to: docs/reference-guides/core-blocks/{block}.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath( import.meta.url );
const __dirname = path.dirname( __filename );

const ROOT_DIR = path.resolve( __dirname, '../..' );
const BLOCK_LIBRARY_DIR = path.resolve(
	ROOT_DIR,
	'packages/block-library/src'
);
const DOCS_DIR = path.resolve( ROOT_DIR, 'docs/reference-guides/core-blocks' );

const SOURCE_URL_BASE =
	'https://github.com/WordPress/gutenberg/tree/trunk/packages/block-library/src/';

/**
 * Discover all block directories that contain a block.json.
 *
 * @return {string[]} Sorted list of directory names.
 */
function getBlockDirs() {
	return fs
		.readdirSync( BLOCK_LIBRARY_DIR, { withFileTypes: true } )
		.filter(
			( d ) =>
				d.isDirectory() &&
				fs.existsSync(
					path.join( BLOCK_LIBRARY_DIR, d.name, 'block.json' )
				)
		)
		.map( ( d ) => d.name )
		.sort();
}

/**
 * Read and parse a block.json file.
 *
 * @param {string} blockDir Directory name inside block-library/src.
 * @return {Object} Parsed block.json contents.
 */
function readBlockJson( blockDir ) {
	const filePath = path.join( BLOCK_LIBRARY_DIR, blockDir, 'block.json' );
	return JSON.parse( fs.readFileSync( filePath, 'utf-8' ) );
}

/**
 * Check which source files exist for a block.
 *
 * @param {string} blockDir Directory name.
 * @return {Object} Flags for each possible source file.
 */
function getBlockFiles( blockDir ) {
	const dir = path.join( BLOCK_LIBRARY_DIR, blockDir );
	return {
		hasSaveJs: fs.existsSync( path.join( dir, 'save.js' ) ),
		hasIndexPhp: fs.existsSync( path.join( dir, 'index.php' ) ),
		hasEditJs: fs.existsSync( path.join( dir, 'edit.js' ) ),
		hasDeprecated: fs.existsSync( path.join( dir, 'deprecated.js' ) ),
		hasVariations: fs.existsSync( path.join( dir, 'variations.js' ) ),
	};
}

// ─── Per-block detail pages ─────────────────────────────────────────────────

/**
 * Format attributes as a Markdown table.
 *
 * @param {Object} attributes
 * @return {string} Markdown table or placeholder text.
 */
function formatAttributesTable( attributes ) {
	if ( ! attributes || Object.keys( attributes ).length === 0 ) {
		return '_This block has no custom attributes._';
	}

	const rows = [
		'| Attribute | Type | Default | Description |',
		'|-----------|------|---------|-------------|',
	];

	for ( const [ attrName, attrDef ] of Object.entries( attributes ) ) {
		const type = Array.isArray( attrDef.type )
			? attrDef.type.join( ' \\| ' )
			: attrDef.type || 'N/A';
		const defaultVal =
			attrDef.default !== undefined
				? `\`${ JSON.stringify( attrDef.default ) }\``
				: '—';

		const descParts = [];
		if ( attrDef.source ) {
			descParts.push( `Source: \`${ attrDef.source }\`` );
		}
		if ( attrDef.selector ) {
			descParts.push( `Selector: \`${ attrDef.selector }\`` );
		}
		if ( attrDef.attribute ) {
			descParts.push( `HTML attr: \`${ attrDef.attribute }\`` );
		}
		if ( attrDef.enum ) {
			descParts.push(
				`Enum: ${ attrDef.enum
					.map( ( v ) => `\`${ v }\`` )
					.join( ', ' ) }`
			);
		}
		if ( attrDef.role ) {
			descParts.push( `Role: \`${ attrDef.role }\`` );
		}

		const desc = descParts.length > 0 ? descParts.join( '. ' ) : '—';
		rows.push(
			`| \`${ attrName }\` | \`${ type }\` | ${ defaultVal } | ${ desc } |`
		);
	}

	return rows.join( '\n' );
}

/**
 * Format supports as a readable list.
 *
 * @param {Object} supports
 * @return {string} Markdown list or placeholder text.
 */
function formatSupports( supports ) {
	if ( ! supports || Object.keys( supports ).length === 0 ) {
		return '_This block does not declare explicit supports._';
	}

	const lines = [];

	for ( const [ key, value ] of Object.entries( supports ) ) {
		if ( key.startsWith( '__' ) ) {
			continue; // Skip experimental/unstable top-level keys in detail view.
		}
		if ( typeof value === 'boolean' ) {
			lines.push( `- **${ key }**: \`${ value }\`` );
		} else if ( Array.isArray( value ) ) {
			lines.push(
				`- **${ key }**: ${ value
					.map( ( v ) => `\`${ JSON.stringify( v ) }\`` )
					.join( ', ' ) }`
			);
		} else if ( typeof value === 'object' && value !== null ) {
			lines.push( `- **${ key }**:` );
			for ( const [ subKey, subValue ] of Object.entries( value ) ) {
				if ( subKey.startsWith( '__' ) ) {
					continue;
				}
				if (
					typeof subValue === 'object' &&
					subValue !== null
				) {
					lines.push(
						`  - ${ subKey }: \`${ JSON.stringify( subValue ) }\``
					);
				} else {
					lines.push( `  - ${ subKey }: \`${ subValue }\`` );
				}
			}
		} else {
			lines.push(
				`- **${ key }**: \`${ JSON.stringify( value ) }\``
			);
		}
	}

	return lines.length > 0
		? lines.join( '\n' )
		: '_This block does not declare explicit supports._';
}

/**
 * Format context information.
 *
 * @param {string[]} usesContext
 * @param {Object}   providesContext
 * @return {string|null} Markdown or null if no context.
 */
function formatContext( usesContext, providesContext ) {
	const parts = [];

	if ( usesContext && usesContext.length > 0 ) {
		parts.push( '**Uses context:**' );
		parts.push( '' );
		for ( const ctx of usesContext ) {
			parts.push( `- \`${ ctx }\`` );
		}
	}

	if ( providesContext && Object.keys( providesContext ).length > 0 ) {
		if ( parts.length > 0 ) {
			parts.push( '' );
		}
		parts.push( '**Provides context:**' );
		parts.push( '' );
		for ( const [ key, value ] of Object.entries( providesContext ) ) {
			parts.push( `- \`${ key }\` → attribute \`${ value }\`` );
		}
	}

	return parts.length > 0 ? parts.join( '\n' ) : null;
}

/**
 * Format block relationships (parent, ancestor, allowedBlocks).
 *
 * @param {Object} blockJson
 * @return {string|null} Markdown or null if no relationships.
 */
function formatRelationships( blockJson ) {
	const parts = [];

	if ( blockJson.parent && blockJson.parent.length > 0 ) {
		parts.push( '**Parent blocks (direct):**' );
		for ( const p of blockJson.parent ) {
			parts.push( `- \`${ p }\`` );
		}
	}

	if ( blockJson.ancestor && blockJson.ancestor.length > 0 ) {
		if ( parts.length > 0 ) {
			parts.push( '' );
		}
		parts.push( '**Ancestor blocks:**' );
		for ( const a of blockJson.ancestor ) {
			parts.push( `- \`${ a }\`` );
		}
	}

	if ( blockJson.allowedBlocks && blockJson.allowedBlocks.length > 0 ) {
		if ( parts.length > 0 ) {
			parts.push( '' );
		}
		parts.push( '**Allowed inner blocks:**' );
		for ( const b of blockJson.allowedBlocks ) {
			parts.push( `- \`${ b }\`` );
		}
	}

	return parts.length > 0 ? parts.join( '\n' ) : null;
}

/**
 * Format block styles as a table.
 *
 * @param {Array} styles
 * @return {string|null} Markdown table or null.
 */
function formatStyles( styles ) {
	if ( ! styles || styles.length === 0 ) {
		return null;
	}

	const rows = [
		'| Style Name | Label | Default |',
		'|------------|-------|---------|',
	];

	for ( const style of styles ) {
		rows.push(
			`| \`${ style.name }\` | ${ style.label } | ${
				style.isDefault ? 'Yes' : 'No'
			} |`
		);
	}

	return rows.join( '\n' );
}

/**
 * Format CSS selectors from block.json.
 *
 * @param {Object} selectors
 * @return {string|null} Markdown list or null.
 */
function formatSelectors( selectors ) {
	if ( ! selectors || Object.keys( selectors ).length === 0 ) {
		return null;
	}

	const lines = [];
	for ( const [ key, value ] of Object.entries( selectors ) ) {
		if ( typeof value === 'string' ) {
			lines.push( `- **${ key }**: \`${ value }\`` );
		} else if ( typeof value === 'object' ) {
			lines.push( `- **${ key }**:` );
			for ( const [ subKey, subValue ] of Object.entries( value ) ) {
				lines.push( `  - ${ subKey }: \`${ subValue }\`` );
			}
		}
	}
	return lines.join( '\n' );
}

/**
 * Determine block type (static, dynamic, hybrid).
 *
 * @param {Object} files File existence flags.
 * @return {string} One of 'static', 'dynamic', 'hybrid', 'unknown'.
 */
function getBlockType( files ) {
	if ( files.hasSaveJs && files.hasIndexPhp ) {
		return 'hybrid';
	}
	if ( files.hasSaveJs ) {
		return 'static';
	}
	if ( files.hasIndexPhp ) {
		return 'dynamic';
	}
	return 'unknown';
}

/**
 * Generate a block comment example from block.json data.
 *
 * @param {string} slug       Block slug without core/ prefix.
 * @param {Object} attributes Block attributes definition.
 * @param {string} blockType  'static', 'dynamic', or 'hybrid'.
 * @return {string} HTML block comment example.
 */
function generateBlockCommentExample( slug, attributes, blockType ) {
	const exampleAttrs = {};
	if ( attributes ) {
		for ( const [ attrName, attrDef ] of Object.entries( attributes ) ) {
			if ( attrDef.default !== undefined ) {
				exampleAttrs[ attrName ] = attrDef.default;
			}
		}
	}

	const attrsStr =
		Object.keys( exampleAttrs ).length > 0
			? ` ${ JSON.stringify( exampleAttrs ) }`
			: '';

	if ( blockType === 'dynamic' ) {
		return `<!-- wp:${ slug }${ attrsStr } /-->`;
	}

	return `<!-- wp:${ slug }${ attrsStr } -->\n<!-- Content... -->\n<!-- /wp:${ slug } -->`;
}

/**
 * Generate the full per-block detail page.
 *
 * @param {string} blockDir Directory name.
 * @return {string} Full Markdown document.
 */
function generateBlockDetailPage( blockDir ) {
	const blockJson = readBlockJson( blockDir );
	const files = getBlockFiles( blockDir );
	const blockType = getBlockType( files );

	const {
		name,
		title,
		category,
		description,
		keywords,
		apiVersion,
		attributes,
		supports,
		usesContext,
		providesContext,
		styles,
		selectors,
	} = blockJson;

	const slug = name.replace( 'core/', '' );
	const lines = [];

	// Title and metadata.
	lines.push( `# ${ title }` );
	lines.push( '' );
	lines.push( `**Name:** \`${ name }\`` );
	lines.push( `**Category:** ${ category }` );
	if ( apiVersion ) {
		lines.push( `**API Version:** ${ apiVersion }` );
	}

	const typeLabel = {
		static: 'Static (saved in post content)',
		dynamic: 'Dynamic (server-rendered)',
		hybrid: 'Hybrid (static save + server enhancements)',
	};
	lines.push( `**Block Type:** ${ typeLabel[ blockType ] || 'Unknown' }` );
	lines.push( '' );

	if ( description ) {
		lines.push( `> ${ description }` );
		lines.push( '' );
	}

	if ( keywords && keywords.length > 0 ) {
		lines.push(
			`**Keywords:** ${ keywords
				.map( ( k ) => `\`${ k }\`` )
				.join( ', ' ) }`
		);
		lines.push( '' );
	}

	// Block relationships.
	const relationships = formatRelationships( blockJson );
	if ( relationships ) {
		lines.push( '## Block Relationships' );
		lines.push( '' );
		lines.push( relationships );
		lines.push( '' );
	}

	// Attributes.
	lines.push( '## Attributes' );
	lines.push( '' );
	lines.push( formatAttributesTable( attributes ) );
	lines.push( '' );

	// Supports.
	lines.push( '## Supports' );
	lines.push( '' );
	lines.push( formatSupports( supports ) );
	lines.push( '' );

	// Context.
	const contextSection = formatContext( usesContext, providesContext );
	if ( contextSection ) {
		lines.push( '## Context' );
		lines.push( '' );
		lines.push( contextSection );
		lines.push( '' );
	}

	// Styles.
	const stylesSection = formatStyles( styles );
	if ( stylesSection ) {
		lines.push( '## Block Styles' );
		lines.push( '' );
		lines.push( stylesSection );
		lines.push( '' );
	}

	// Selectors.
	const selectorsSection = formatSelectors( selectors );
	if ( selectorsSection ) {
		lines.push( '## CSS Selectors' );
		lines.push( '' );
		lines.push( selectorsSection );
		lines.push( '' );
	}

	// Block markup example.
	lines.push( '## Block Markup' );
	lines.push( '' );
	if ( blockType === 'dynamic' ) {
		lines.push(
			'This is a **dynamic block**. It is rendered on the server and does not save HTML in post content.'
		);
		lines.push( '' );
		lines.push( 'In post content, it is stored as a block comment:' );
	} else if ( blockType === 'hybrid' ) {
		lines.push(
			'This is a **hybrid block**. It saves static markup that the server may enhance during rendering.'
		);
	} else {
		lines.push(
			'This is a **static block**. The markup is saved directly in the post content.'
		);
	}
	lines.push( '' );
	lines.push( '```html' );
	lines.push(
		generateBlockCommentExample( slug, attributes, blockType )
	);
	lines.push( '```' );
	lines.push( '' );

	// Source files reference.
	lines.push( '## Source' );
	lines.push( '' );
	lines.push(
		`- [block.json](${ SOURCE_URL_BASE }${ blockDir }/block.json)`
	);
	if ( files.hasEditJs ) {
		lines.push(
			`- [edit.js](${ SOURCE_URL_BASE }${ blockDir }/edit.js)`
		);
	}
	if ( files.hasSaveJs ) {
		lines.push(
			`- [save.js](${ SOURCE_URL_BASE }${ blockDir }/save.js)`
		);
	}
	if ( files.hasIndexPhp ) {
		lines.push(
			`- [index.php](${ SOURCE_URL_BASE }${ blockDir }/index.php)`
		);
	}
	if ( files.hasDeprecated ) {
		lines.push(
			`- [deprecated.js](${ SOURCE_URL_BASE }${ blockDir }/deprecated.js)`
		);
	}
	if ( files.hasVariations ) {
		lines.push(
			`- [variations.js](${ SOURCE_URL_BASE }${ blockDir }/variations.js)`
		);
	}
	lines.push( '' );

	return lines.join( '\n' );
}

const blockDirs = getBlockDirs();

// Ensure output directory exists.
fs.mkdirSync( DOCS_DIR, { recursive: true } );

// Generate per-block detail pages.
blockDirs.forEach( ( blockDir ) => {
	const content = generateBlockDetailPage( blockDir );
	fs.writeFileSync(
		path.join( DOCS_DIR, `${ blockDir }.md` ),
		content,
		{ encoding: 'utf8' }
	);
} );

// eslint-disable-next-line no-console
console.log(
	`Generated docs for ${ blockDirs.length } blocks (${ DOCS_DIR })`
);
