import CDP from 'chrome-remote-interface';
import type {
	Transport,
	Block,
	EditorState,
	ThemeStyles,
	ComputedLayout,
} from './types.js';

interface CDPClient {
	Runtime: {
		evaluate: ( params: {
			expression: string;
			returnByValue?: boolean;
			awaitPromise?: boolean;
		} ) => Promise< {
			result: { value?: unknown };
			exceptionDetails?: unknown;
		} >;
	};
	Page: {
		captureScreenshot: ( params?: {
			format?: string;
			quality?: number;
			clip?: {
				x: number;
				y: number;
				width: number;
				height: number;
				scale: number;
			};
		} ) => Promise< { data: string } >;
	};
	DOM: {
		getDocument: () => Promise< { root: { nodeId: number } } >;
		querySelector: ( params: {
			nodeId: number;
			selector: string;
		} ) => Promise< { nodeId: number } >;
		getBoxModel: ( params: { nodeId: number } ) => Promise< {
			model: { content: number[]; width: number; height: number };
		} >;
	};
	close: () => Promise< void >;
}

export interface CDPTransportOptions {
	/** WebSocket URL, e.g. ws://localhost:9222 */
	target: string;
}

export class CDPTransport implements Transport {
	private client: CDPClient | null = null;
	private options: CDPTransportOptions;

	constructor( options: CDPTransportOptions ) {
		this.options = options;
	}

	async connect(): Promise< void > {
		// Parse the target to get host/port
		const url = new URL( this.options.target );
		const host = url.hostname || 'localhost';
		const port = parseInt( url.port, 10 ) || 9222;

		this.client = ( await CDP( { host, port } ) ) as unknown as CDPClient;
	}

	async disconnect(): Promise< void > {
		if ( this.client ) {
			await this.client.close();
			this.client = null;
		}
	}

	private async evaluate< T >( expression: string ): Promise< T > {
		if ( ! this.client ) {
			throw new Error( 'CDP not connected. Call connect() first.' );
		}
		const { result, exceptionDetails } = await this.client.Runtime.evaluate(
			{
				expression: `(async () => { ${ expression } })()`,
				returnByValue: true,
				awaitPromise: true,
			}
		);
		if ( exceptionDetails ) {
			throw new Error(
				`CDP evaluate error: ${ JSON.stringify( exceptionDetails ) }`
			);
		}
		return result.value as T;
	}

	async getEditorState(): Promise< EditorState > {
		return this.evaluate< EditorState >( `
			const blockEditorSelect = window.wp.data.select("core/block-editor");
			const editorSelect = window.wp.data.select("core/edit-site") || window.wp.data.select("core/editor");
			const selectedClientId = blockEditorSelect.getSelectedBlockClientId();
			const selectedName = selectedClientId ? blockEditorSelect.getBlockName(selectedClientId) : undefined;

			// Try to get current document info
			let templateSlug, templateType, pageId, pageTitle, editedEntityType, editedEntityId;
			try {
				const editSiteSelect = window.wp.data.select("core/edit-site");
				if (editSiteSelect) {
					const context = editSiteSelect.getEditedPostContext?.() || {};
					templateSlug = editSiteSelect.getEditedPostSlug?.();
					templateType = editSiteSelect.getEditedPostType?.();
					editedEntityType = templateType;
					editedEntityId = editSiteSelect.getEditedPostId?.();
					pageId = context.postId;
				}
			} catch(e) {}

			try {
				const coreEditorSelect = window.wp.data.select("core/editor");
				if (coreEditorSelect && !templateSlug) {
					editedEntityType = coreEditorSelect.getCurrentPostType?.();
					editedEntityId = coreEditorSelect.getCurrentPostId?.();
				}
			} catch(e) {}

			const isDirty = window.wp.data.select("core")?.hasEditsForEntityRecord?.("postType", editedEntityType || "wp_template", editedEntityId) || false;

			return {
				templateSlug,
				templateType,
				pageId,
				pageTitle,
				editedEntityType,
				editedEntityId,
				isDirty,
				selectedBlockClientId: selectedClientId || undefined,
				selectedBlockName: selectedName || undefined,
			};
		` );
	}

	async openDocument( args: {
		type: 'template' | 'page' | 'template-part' | 'pattern';
		slug?: string;
		id?: number;
	} ): Promise< { success: boolean; message: string } > {
		return this.evaluate( `
			const editSite = window.wp.data.dispatch("core/edit-site");
			if (!editSite) {
				return { success: false, message: "edit-site store not available" };
			}
			const type = ${ JSON.stringify( args.type ) };
			const slug = ${ JSON.stringify( args.slug ) };
			const id = ${ JSON.stringify( args.id ) };

			let postType;
			if (type === "template") postType = "wp_template";
			else if (type === "template-part") postType = "wp_template_part";
			else if (type === "pattern") postType = "wp_block";
			else postType = "page";

			if (type === "page" && id) {
				await editSite.setPage?.({ context: { postType: "page", postId: id } });
			} else if (slug) {
				await editSite.setTemplate?.(slug);
			} else if (id) {
				await editSite.setEditedEntity?.(postType, id);
			}

			return { success: true, message: "Navigated to " + type + " " + (slug || id) };
		` );
	}

	async getBlocks( args?: {
		rootClientId?: string;
		blockName?: string;
	} ): Promise< Block[] > {
		return this.evaluate< Block[] >( `
			const select = window.wp.data.select("core/block-editor");
			const rootClientId = ${ JSON.stringify( args?.rootClientId ?? null ) };
			const blockName = ${ JSON.stringify( args?.blockName ?? null ) };

			function serializeBlock(block) {
				return {
					clientId: block.clientId,
					name: block.name,
					attributes: block.attributes,
					innerBlocks: (block.innerBlocks || []).map(serializeBlock),
				};
			}

			let blocks;
			if (blockName) {
				const ids = select.getBlocksByName(blockName);
				blocks = ids.map(id => select.getBlock(id)).filter(Boolean);
			} else {
				blocks = select.getBlocks(rootClientId || undefined);
			}

			return blocks.map(serializeBlock);
		` );
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
		return this.evaluate( `
			const blockDefs = ${ JSON.stringify( args.blocks ) };
			const rootClientId = ${ JSON.stringify( args.rootClientId ?? null ) };
			const index = ${ JSON.stringify( args.index ?? null ) };

			function createBlockRecursive(def) {
				const innerBlocks = (def.innerBlocks || []).map(createBlockRecursive);
				return window.wp.blocks.createBlock(def.name, def.attributes || {}, innerBlocks);
			}

			const blocks = blockDefs.map(createBlockRecursive);
			const dispatch = window.wp.data.dispatch("core/block-editor");

			if (index !== null) {
				await dispatch.insertBlocks(blocks, index, rootClientId || undefined);
			} else {
				await dispatch.insertBlocks(blocks, undefined, rootClientId || undefined);
			}

			return { clientIds: blocks.map(b => b.clientId) };
		` );
	}

	async updateBlock( args: {
		clientId: string;
		attributes: Record< string, unknown >;
	} ): Promise< { success: boolean } > {
		return this.evaluate( `
			const clientId = ${ JSON.stringify( args.clientId ) };
			const attributes = ${ JSON.stringify( args.attributes ) };
			await window.wp.data.dispatch("core/block-editor").updateBlockAttributes(clientId, attributes);
			return { success: true };
		` );
	}

	async removeBlocks( args: {
		clientIds: string[];
	} ): Promise< { success: boolean } > {
		return this.evaluate( `
			await window.wp.data.dispatch("core/block-editor").removeBlocks(${ JSON.stringify(
				args.clientIds
			) });
			return { success: true };
		` );
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
		return this.evaluate( `
			const clientIds = ${ JSON.stringify( args.clientIds ) };
			const blockDefs = ${ JSON.stringify( args.blocks ) };

			function createBlockRecursive(def) {
				const innerBlocks = (def.innerBlocks || []).map(createBlockRecursive);
				return window.wp.blocks.createBlock(def.name, def.attributes || {}, innerBlocks);
			}

			const blocks = blockDefs.map(createBlockRecursive);
			await window.wp.data.dispatch("core/block-editor").replaceBlocks(clientIds, blocks);
			return { success: true };
		` );
	}

	async save(): Promise< { success: boolean; message: string } > {
		return this.evaluate( `
			try {
				const editorDispatch = window.wp.data.dispatch("core/editor");
				if (editorDispatch?.savePost) {
					await editorDispatch.savePost();
					return { success: true, message: "Saved via core/editor" };
				}
				const editSiteDispatch = window.wp.data.dispatch("core/edit-site");
				if (editSiteDispatch?.saveEditedEntityRecord) {
					await editSiteDispatch.saveEditedEntityRecord();
					return { success: true, message: "Saved via core/edit-site" };
				}
				return { success: false, message: "No save method available" };
			} catch(e) {
				return { success: false, message: e.message };
			}
		` );
	}

	async getStyles(): Promise< ThemeStyles > {
		return this.evaluate< ThemeStyles >( `
			const globalStyles = window.wp.data.select("core")
				?.getEditedEntityRecord("root", "globalStyles", window.wp.data.select("core/edit-site")?.getSettings?.()?.globalStylesId);
			if (globalStyles) {
				return {
					settings: globalStyles.settings || {},
					styles: globalStyles.styles || {},
					version: globalStyles.version,
				};
			}
			// Fallback: read from settings
			const settings = window.wp.data.select("core/block-editor").getSettings();
			return {
				settings: settings.__experimentalFeatures || {},
				styles: {},
			};
		` );
	}

	async setStyles( args: {
		settings?: Record< string, unknown >;
		styles?: Record< string, unknown >;
	} ): Promise< { success: boolean } > {
		return this.evaluate( `
			const globalStylesId = window.wp.data.select("core/edit-site")?.getSettings?.()?.globalStylesId;
			if (!globalStylesId) return { success: false };

			const edits = {};
			if (${ JSON.stringify( args.settings ) }) edits.settings = ${ JSON.stringify(
				args.settings
			) };
			if (${ JSON.stringify( args.styles ) }) edits.styles = ${ JSON.stringify(
				args.styles
			) };

			await window.wp.data.dispatch("core").editEntityRecord("root", "globalStyles", globalStylesId, edits);
			return { success: true };
		` );
	}

	async getScreenshot( args?: {
		selector?: string;
		fullPage?: boolean;
	} ): Promise< { base64: string; mimeType: string } > {
		if ( ! this.client ) {
			throw new Error( 'CDP not connected' );
		}

		let clip:
			| {
					x: number;
					y: number;
					width: number;
					height: number;
					scale: number;
			  }
			| undefined;

		if ( args?.selector ) {
			const doc = await this.client.DOM.getDocument();
			const node = await this.client.DOM.querySelector( {
				nodeId: doc.root.nodeId,
				selector: args.selector,
			} );
			if ( node.nodeId ) {
				const box = await this.client.DOM.getBoxModel( {
					nodeId: node.nodeId,
				} );
				clip = {
					x: box.model.content[ 0 ],
					y: box.model.content[ 1 ],
					width: box.model.width,
					height: box.model.height,
					scale: 1,
				};
			}
		}

		const screenshot = await this.client.Page.captureScreenshot( {
			format: 'png',
			...( clip ? { clip } : {} ),
		} );

		return { base64: screenshot.data, mimeType: 'image/png' };
	}

	async getComputedLayout( args: {
		clientIds: string[];
		properties?: string[];
	} ): Promise< ComputedLayout[] > {
		return this.evaluate< ComputedLayout[] >( `
			const clientIds = ${ JSON.stringify( args.clientIds ) };
			const properties = ${ JSON.stringify(
				args.properties ?? [
					'display',
					'position',
					'width',
					'height',
					'margin',
					'padding',
					'gap',
				]
			) };

			const results = [];
			for (const clientId of clientIds) {
				const el = document.querySelector('[data-block="' + clientId + '"]');
				if (!el) {
					results.push({ clientId, tagName: 'unknown', boundingRect: { x: 0, y: 0, width: 0, height: 0 }, computedStyle: {} });
					continue;
				}
				const rect = el.getBoundingClientRect();
				const style = window.getComputedStyle(el);
				const computedStyle = {};
				for (const prop of properties) {
					computedStyle[prop] = style.getPropertyValue(prop);
				}
				results.push({
					clientId,
					tagName: el.tagName.toLowerCase(),
					boundingRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
					computedStyle,
				});
			}
			return results;
		` );
	}

	async parseMarkup( args: {
		markup: string;
	} ): Promise< { blocks: Block[]; isValid: boolean } > {
		return this.evaluate( `
			const markup = ${ JSON.stringify( args.markup ) };
			const parsed = window.wp.blocks.parse(markup);

			function serializeBlock(block) {
				return {
					clientId: block.clientId,
					name: block.name,
					attributes: block.attributes,
					innerBlocks: (block.innerBlocks || []).map(serializeBlock),
				};
			}

			const blocks = parsed.map(serializeBlock);
			const isValid = parsed.every(b => b.isValid !== false);
			return { blocks, isValid };
		` );
	}

	async exportTemplate(): Promise< { html: string } > {
		return this.evaluate( `
			const blocks = window.wp.data.select("core/block-editor").getBlocks();
			const html = window.wp.blocks.serialize(blocks);
			return { html };
		` );
	}
}
