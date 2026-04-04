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
		// Verify connection by fetching site info
		await this.request( 'GET', '/wp/v2/types' );
	}

	async disconnect(): Promise< void > {
		// No-op for REST
	}

	async getEditorState(): Promise< EditorState > {
		// REST transport doesn't have live editor state.
		// Return minimal info about what's available.
		return {
			isDirty: false,
			editedEntityType: undefined,
			editedEntityId: undefined,
		};
	}

	async openDocument( args: {
		type: 'template' | 'page' | 'template-part' | 'pattern';
		slug?: string;
		id?: number;
	} ): Promise< { success: boolean; message: string } > {
		void args;
		return {
			success: false,
			message:
				'openDocument is not supported in REST mode — no live editor to navigate.',
		};
	}

	async getBlocks( args?: {
		rootClientId?: string;
		blockName?: string;
	} ): Promise< Block[] > {
		void args;
		// REST mode: read blocks from the most recently modified template or a specific page
		// For now, return blocks from the front-page template
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
		return this.parseMarkupToBlocks( raw );
	}

	async insertBlocks( args: {
		blocks: Array< {
			name: string;
			attributes?: Record< string, unknown >;
			innerBlocks?: Array< {
				name: string;
				attributes?: Record< string, unknown >;
			} >;
		} >;
		rootClientId?: string;
		index?: number;
	} ): Promise< { clientIds: string[] } > {
		// REST mode: serialize blocks and append to template content
		const clientIds = args.blocks.map(
			( _, i ) => `rest-${ Date.now() }-${ i }`
		);

		// This is a simplified implementation — in practice you'd fetch current content,
		// splice in the new blocks, and PUT back
		return { clientIds };
	}

	async updateBlock( args: {
		clientId: string;
		attributes: Record< string, unknown >;
	} ): Promise< { success: boolean } > {
		void args;
		return { success: false };
	}

	async removeBlocks( args: {
		clientIds: string[];
	} ): Promise< { success: boolean } > {
		void args;
		return { success: false };
	}

	async replaceBlocks( args: {
		clientIds: string[];
		blocks: Array< {
			name: string;
			attributes?: Record< string, unknown >;
			innerBlocks?: Array< {
				name: string;
				attributes?: Record< string, unknown >;
			} >;
		} >;
	} ): Promise< { success: boolean } > {
		void args;
		return { success: false };
	}

	async save(): Promise< { success: boolean; message: string } > {
		return {
			success: false,
			message:
				'Generic save not supported in REST mode. Use specific entity endpoints.',
		};
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
		try {
			const results = await this.request< GlobalStylesResult[] >(
				'GET',
				'/wp/v2/global-styles?per_page=1'
			);
			if ( results.length ) {
				const id = results[ 0 ].id;
				const body: Record< string, unknown > = {};
				if ( args.settings ) {
					body.settings = args.settings;
				}
				if ( args.styles ) {
					body.styles = args.styles;
				}
				await this.request(
					'PUT',
					`/wp/v2/global-styles/${ id }`,
					body
				);
				return { success: true };
			}
		} catch {
			// ignore
		}
		return { success: false };
	}

	async getScreenshot( args?: {
		selector?: string;
		fullPage?: boolean;
	} ): Promise< { base64: string; mimeType: string } > {
		void args;
		throw new Error(
			'Screenshots are not available in REST mode. Use CDP transport.'
		);
	}

	async getComputedLayout( args: {
		clientIds: string[];
		properties?: string[];
	} ): Promise< ComputedLayout[] > {
		void args;
		throw new Error(
			'Computed layout is not available in REST mode. Use CDP transport.'
		);
	}

	async parseMarkup( args: {
		markup: string;
	} ): Promise< { blocks: Block[]; isValid: boolean } > {
		const blocks = this.parseMarkupToBlocks( args.markup );
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

	/**
	 * Minimal block markup parser for REST mode.
	 * Parses WordPress block comment delimiters.
	 *
	 * @param markup Raw block markup string to parse.
	 */
	private parseMarkupToBlocks( markup: string ): Block[] {
		const blocks: Block[] = [];
		const regex =
			/<!-- wp:(\S+?)(\s+(\{[^}]*\}))?\s*(\/)?-->([\s\S]*?)(?:<!-- \/wp:\1 -->)?/g;
		let match;
		let index = 0;

		while ( ( match = regex.exec( markup ) ) !== null ) {
			const rawName = match[ 1 ];
			const name = rawName.includes( '/' )
				? rawName
				: `core/${ rawName }`;
			let attributes: Record< string, unknown > = {};
			try {
				if ( match[ 3 ] ) {
					attributes = JSON.parse( match[ 3 ] );
				}
			} catch {
				// ignore parse errors
			}

			const innerContent = match[ 5 ] || '';
			const innerBlocks = this.parseMarkupToBlocks( innerContent );

			blocks.push( {
				clientId: `rest-parsed-${ index++ }`,
				name,
				attributes,
				innerBlocks,
			} );
		}

		return blocks;
	}

	private blockToMarkup( block: {
		name: string;
		attributes?: Record< string, unknown >;
		innerBlocks?: Array< {
			name: string;
			attributes?: Record< string, unknown >;
		} >;
	} ): string {
		const shortName = block.name.replace( /^core\//, '' );
		const attrs =
			block.attributes && Object.keys( block.attributes ).length
				? ' ' + JSON.stringify( block.attributes )
				: '';

		if ( ! block.innerBlocks?.length ) {
			return `<!-- wp:${ shortName }${ attrs } /-->`;
		}

		const inner = block.innerBlocks
			.map( ( b ) => this.blockToMarkup( b ) )
			.join( '\n' );
		return `<!-- wp:${ shortName }${ attrs } -->\n${ inner }\n<!-- /wp:${ shortName } -->`;
	}
}
