import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface BlockMeta {
	name: string;
	title: string;
	category: string;
	description: string;
	keywords: string[];
	attributes: Record<
		string,
		{
			type?: string;
			source?: string;
			selector?: string;
			default?: unknown;
			role?: string;
			enum?: unknown[];
		}
	>;
	supports: Record< string, unknown >;
	parent?: string[];
	ancestor?: string[];
	styles?: Array< { name: string; label: string; isDefault?: boolean } >;
	apiVersion?: number;
	/** Whether save.js exports a noop (dynamic block) */
	hasDynamicRender: boolean;
}

let cachedCatalog: Map< string, BlockMeta > | null = null;

function findBlockLibraryPath(): string {
	// Walk up from this file to find the packages directory
	const thisDir = dirname( fileURLToPath( import.meta.url ) );
	// In build: packages/editor-mcp/build/block-catalog.js → packages/editor-mcp/ → packages/
	const packagesDir = join( thisDir, '..', '..' );
	return join( packagesDir, 'block-library', 'src' );
}

export async function loadBlockCatalog(): Promise< Map< string, BlockMeta > > {
	if ( cachedCatalog ) {
		return cachedCatalog;
	}

	const catalog = new Map< string, BlockMeta >();
	const blockLibPath = findBlockLibraryPath();

	let entries: string[];
	try {
		entries = await readdir( blockLibPath );
	} catch {
		// Block library not found at expected path
		return catalog;
	}

	for ( const entry of entries ) {
		const blockJsonPath = join( blockLibPath, entry, 'block.json' );
		try {
			const raw = await readFile( blockJsonPath, 'utf-8' );
			const json = JSON.parse( raw );

			// Check if save.js is a noop / dynamic block
			let hasDynamicRender = false;
			try {
				const savePath = join( blockLibPath, entry, 'save.js' );
				const saveContent = await readFile( savePath, 'utf-8' );
				// Dynamic blocks return null from save
				hasDynamicRender =
					/return\s+null/.test( saveContent ) ||
					/save\s*:\s*null/.test( saveContent ) ||
					// Check for InnerBlocks.Content only (no wrapper)
					( ! /useBlockProps\.save/.test( saveContent ) &&
						/InnerBlocks\.Content/.test( saveContent ) );
			} catch {
				// No save.js means it's likely a dynamic block (PHP rendered)
				hasDynamicRender = true;
			}

			const meta: BlockMeta = {
				name: json.name || `core/${ entry }`,
				title: json.title || entry,
				category: json.category || 'common',
				description: json.description || '',
				keywords: json.keywords || [],
				attributes: json.attributes || {},
				supports: json.supports || {},
				parent: json.parent,
				ancestor: json.ancestor,
				styles: json.styles,
				apiVersion: json.apiVersion,
				hasDynamicRender,
			};

			catalog.set( meta.name, meta );
		} catch {
			// Skip directories without valid block.json
		}
	}

	cachedCatalog = catalog;
	return catalog;
}

export async function lookupBlock(
	query: string
): Promise< BlockMeta | undefined > {
	const catalog = await loadBlockCatalog();

	// Exact match by name
	if ( catalog.has( query ) ) {
		return catalog.get( query );
	}

	// Try with core/ prefix
	if ( catalog.has( `core/${ query }` ) ) {
		return catalog.get( `core/${ query }` );
	}

	// Search by title or keyword
	const lowerQuery = query.toLowerCase();
	for ( const [ , meta ] of catalog ) {
		if ( meta.title.toLowerCase() === lowerQuery ) {
			return meta;
		}
		if ( meta.keywords.some( ( k ) => k.toLowerCase() === lowerQuery ) ) {
			return meta;
		}
	}

	return undefined;
}

export async function searchBlocks( query: string ): Promise< BlockMeta[] > {
	const catalog = await loadBlockCatalog();
	const lowerQuery = query.toLowerCase();
	const results: BlockMeta[] = [];

	for ( const [ , meta ] of catalog ) {
		if (
			meta.name.toLowerCase().includes( lowerQuery ) ||
			meta.title.toLowerCase().includes( lowerQuery ) ||
			meta.description.toLowerCase().includes( lowerQuery ) ||
			meta.keywords.some( ( k ) =>
				k.toLowerCase().includes( lowerQuery )
			)
		) {
			results.push( meta );
		}
	}

	return results;
}
