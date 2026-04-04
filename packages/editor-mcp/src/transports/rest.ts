import type {
	Transport,
	Block,
	EditorState,
	ThemeStyles,
	ComputedLayout,
} from './types.js';

export interface RESTTransportOptions {
	/** WordPress site URL, e.g. http://localhost:8080 */
	baseUrl: string;
	/** WordPress username */
	username: string;
	/** Application password */
	password: string;
}

export class RESTTransport implements Transport {
	private options: RESTTransportOptions;
	private authHeader: string;

	constructor( options: RESTTransportOptions ) {
		this.options = options;
		this.authHeader =
			'Basic ' +
			Buffer.from(
				`${ options.username }:${ options.password }`
			).toString( 'base64' );
	}

	private async request< T >(
		method: string,
		endpoint: string,
		body?: unknown
	): Promise< T > {
		const url = `${ this.options.baseUrl }/wp-json${ endpoint }`;
		const headers: Record< string, string > = {
			Authorization: this.authHeader,
			'Content-Type': 'application/json',
		};

		const response = await fetch( url, {
			method,
			headers,
			...( body ? { body: JSON.stringify( body ) } : {} ),
		} );

		if ( ! response.ok ) {
			const text = await response.text();
			throw new Error( `REST API error ${ response.status }: ${ text }` );
		}

		return ( await response.json() ) as T;
	}

	async connect(): Promise< void > {
		await this.request( 'GET', '/wp/v2/types' );
	}

	async disconnect(): Promise< void > {
		// No-op for REST
	}

	async getEditorState(): Promise< EditorState > {
		return {
			isDirty: false,
			editedEntityType: undefined,
			editedEntityId: undefined,
		};
	}

	async openDocument(): Promise< { success: boolean; message: string } > {
		throw new Error(
			'openDocument requires a live editor. Use CDP transport instead.'
		);
	}

	async getBlocks( args?: {
		rootClientId?: string;
		blockName?: string;
	} ): Promise< Block[] > {
		interface TemplateResult {
			id: string;
			content: { raw: string; block_version: number };
		}

		const templates = await this.request< TemplateResult[] >(
			'GET',
			'/wp/v2/templates?per_page=1&context=edit'
		);
		if ( ! templates.length ) {
			return [];
		}

		const raw = templates[ 0 ].content?.raw || '';
		let blocks = parseBlockMarkup( raw );

		if ( args?.blockName ) {
			blocks = filterBlocksByName( blocks, args.blockName );
		}

		return blocks;
	}

	async insertBlocks(): Promise< { clientIds: string[] } > {
		throw new Error(
			'insertBlocks requires a live editor for proper block creation. Use CDP transport instead.'
		);
	}

	async updateBlock(): Promise< { success: boolean } > {
		throw new Error(
			'updateBlock requires a live editor. Use CDP transport instead.'
		);
	}

	async removeBlocks(): Promise< { success: boolean } > {
		throw new Error(
			'removeBlocks requires a live editor. Use CDP transport instead.'
		);
	}

	async replaceBlocks(): Promise< { success: boolean } > {
		throw new Error(
			'replaceBlocks requires a live editor. Use CDP transport instead.'
		);
	}

	async save(): Promise< { success: boolean; message: string } > {
		throw new Error(
			'save requires a live editor. Use CDP transport instead.'
		);
	}

	async getStyles(): Promise< ThemeStyles > {
		interface GlobalStylesResult {
			settings: Record< string, unknown >;
			styles: Record< string, unknown >;
			version?: number;
		}
		try {
			const results = await this.request< GlobalStylesResult[] >(
				'GET',
				'/wp/v2/global-styles?per_page=1'
			);
			if ( results.length ) {
				return {
					settings: results[ 0 ].settings || {},
					styles: results[ 0 ].styles || {},
					version: results[ 0 ].version,
				};
			}
		} catch {
			// Global styles endpoint may not be available
		}
		return { settings: {}, styles: {} };
	}

	async setStyles( args: {
		settings?: Record< string, unknown >;
		styles?: Record< string, unknown >;
	} ): Promise< { success: boolean } > {
		interface GlobalStylesResult {
			id: number;
		}
		const results = await this.request< GlobalStylesResult[] >(
			'GET',
			'/wp/v2/global-styles?per_page=1'
		);
		if ( ! results.length ) {
			throw new Error( 'No global styles record found' );
		}
		const id = results[ 0 ].id;
		const body: Record< string, unknown > = {};
		if ( args.settings ) {
			body.settings = args.settings;
		}
		if ( args.styles ) {
			body.styles = args.styles;
		}
		await this.request( 'PUT', `/wp/v2/global-styles/${ id }`, body );
		return { success: true };
	}

	async getScreenshot(): Promise< { base64: string; mimeType: string } > {
		throw new Error(
			'Screenshots require a live browser. Use CDP transport instead.'
		);
	}

	async getComputedLayout(): Promise< ComputedLayout[] > {
		throw new Error(
			'Computed layout requires a live browser. Use CDP transport instead.'
		);
	}

	async parseMarkup( args: {
		markup: string;
	} ): Promise< { blocks: Block[]; isValid: boolean } > {
		const blocks = parseBlockMarkup( args.markup );
		return { blocks, isValid: blocks.length > 0 };
	}

	async exportTemplate(): Promise< { html: string } > {
		interface TemplateResult {
			content: { raw: string };
		}
		const templates = await this.request< TemplateResult[] >(
			'GET',
			'/wp/v2/templates?per_page=1&context=edit'
		);
		if ( templates.length ) {
			return { html: templates[ 0 ].content?.raw || '' };
		}
		return { html: '' };
	}
}

// ---------------------------------------------------------------------------
// Block markup parser — exported for testing
// ---------------------------------------------------------------------------

let nextId = 0;
function generateClientId(): string {
	return `rest-${ nextId++ }`;
}

/**
 * Reset ID counter (for deterministic tests).
 */
export function resetParserIds(): void {
	nextId = 0;
}

/**
 * Parse WordPress block markup into a block tree.
 *
 * Handles:
 * - Self-closing blocks: `<!-- wp:spacer /-->`
 * - Blocks with content: `<!-- wp:paragraph -->..content..<!-- /wp:paragraph -->`
 * - Nested blocks of the same type
 * - Namespaced blocks: `<!-- wp:woocommerce/product-title -->`
 * - JSON attributes: `<!-- wp:image {"id":42,"sizeSlug":"large"} -->`
 *
 * @param markup Raw block markup string to parse.
 */
export function parseBlockMarkup( markup: string ): Block[] {
	const blocks: Block[] = [];
	let pos = 0;

	while ( pos < markup.length ) {
		// Find next block comment opener
		const openIdx = markup.indexOf( '<!-- wp:', pos );
		if ( openIdx === -1 ) {
			break;
		}

		// Find the end of the opening comment
		const commentEnd = markup.indexOf( '-->', openIdx );
		if ( commentEnd === -1 ) {
			break;
		}

		const openComment = markup.slice( openIdx, commentEnd + 3 );
		const isSelfClosing = openComment.endsWith( '/-->' );

		// Extract block name and attributes from opening comment
		const parsed = parseOpenComment( openComment );
		if ( ! parsed ) {
			pos = commentEnd + 3;
			continue;
		}

		if ( isSelfClosing ) {
			blocks.push( {
				clientId: generateClientId(),
				name: parsed.name,
				attributes: parsed.attributes,
				innerBlocks: [],
			} );
			pos = commentEnd + 3;
			continue;
		}

		// Find matching close comment, handling nesting
		const closingTag = `<!-- /wp:${ parsed.rawName } -->`;
		const innerStart = commentEnd + 3;
		const closeIdx = findMatchingClose(
			markup,
			innerStart,
			parsed.rawName
		);

		if ( closeIdx === -1 ) {
			// No matching close — treat as self-closing
			blocks.push( {
				clientId: generateClientId(),
				name: parsed.name,
				attributes: parsed.attributes,
				innerBlocks: [],
			} );
			pos = commentEnd + 3;
			continue;
		}

		const innerMarkup = markup.slice( innerStart, closeIdx );
		const innerBlocks = parseBlockMarkup( innerMarkup );

		blocks.push( {
			clientId: generateClientId(),
			name: parsed.name,
			attributes: parsed.attributes,
			innerBlocks,
		} );
		pos = closeIdx + closingTag.length;
	}

	return blocks;
}

interface ParsedComment {
	rawName: string;
	name: string;
	attributes: Record< string, unknown >;
}

function parseOpenComment( comment: string ): ParsedComment | null {
	// Match: <!-- wp:name {json} /--> or <!-- wp:name {json} -->
	const match = comment.match(
		/^<!-- wp:(\S+?)(?:\s+(\{[\s\S]*?\}))?\s*\/?-->$/
	);
	if ( ! match ) {
		return null;
	}

	const rawName = match[ 1 ];
	const name = rawName.includes( '/' ) ? rawName : `core/${ rawName }`;

	let attributes: Record< string, unknown > = {};
	if ( match[ 2 ] ) {
		try {
			attributes = JSON.parse( match[ 2 ] );
		} catch {
			// Malformed JSON — skip attributes
		}
	}

	return { rawName, name, attributes };
}

/**
 * Find the matching close comment for a block, accounting for nested blocks
 * of the same type.
 *
 * @param markup    Full markup string.
 * @param startPos  Position to start searching from (after the opening comment).
 * @param blockName Raw block name (e.g. "group" or "woocommerce/product-title").
 */
function findMatchingClose(
	markup: string,
	startPos: number,
	blockName: string
): number {
	const openPattern = `<!-- wp:${ blockName }`;
	const closePattern = `<!-- /wp:${ blockName } -->`;
	let depth = 1;
	let pos = startPos;

	while ( pos < markup.length && depth > 0 ) {
		const nextOpen = markup.indexOf( openPattern, pos );
		const nextClose = markup.indexOf( closePattern, pos );

		if ( nextClose === -1 ) {
			return -1;
		}

		if ( nextOpen !== -1 && nextOpen < nextClose ) {
			// Check it's actually an opening tag (not a closing one)
			const afterName = markup.slice(
				nextOpen + openPattern.length,
				nextOpen + openPattern.length + 1
			);
			if ( afterName === ' ' || afterName === '/' || afterName === '-' ) {
				// Verify it's not <!-- /wp:... -->
				if (
					! markup
						.slice( nextOpen, nextOpen + closePattern.length + 5 )
						.startsWith( closePattern )
				) {
					depth++;
				}
			}
			pos = nextOpen + openPattern.length;
		} else {
			depth--;
			if ( depth === 0 ) {
				return nextClose;
			}
			pos = nextClose + closePattern.length;
		}
	}

	return -1;
}

/**
 * Recursively filter a block tree by block name.
 *
 * @param blocks Block array to search.
 * @param name   Block name to filter by.
 */
function filterBlocksByName( blocks: Block[], name: string ): Block[] {
	const result: Block[] = [];
	for ( const block of blocks ) {
		if ( block.name === name ) {
			result.push( block );
		}
		result.push( ...filterBlocksByName( block.innerBlocks, name ) );
	}
	return result;
}
