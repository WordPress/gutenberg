/**
 * Transport interface for communicating with the WordPress editor.
 * Two implementations: CDP (live browser) and REST (headless WP REST API).
 */

export interface Block {
	clientId: string;
	name: string;
	attributes: Record< string, unknown >;
	innerBlocks: Block[];
}

export interface EditorState {
	templateSlug?: string;
	templateType?: string;
	pageId?: number;
	pageTitle?: string;
	editedEntityType?: string;
	editedEntityId?: string | number;
	isDirty: boolean;
	selectedBlockClientId?: string;
	selectedBlockName?: string;
}

export interface ComputedLayout {
	clientId: string;
	tagName: string;
	boundingRect: {
		x: number;
		y: number;
		width: number;
		height: number;
	};
	computedStyle: Record< string, string >;
}

export interface ThemeStyles {
	settings: Record< string, unknown >;
	styles: Record< string, unknown >;
	version?: number;
}

export interface Transport {
	/** Connect to the editor */
	connect: () => Promise< void >;

	/** Disconnect */
	disconnect: () => Promise< void >;

	/** Get current editor state */
	getEditorState: () => Promise< EditorState >;

	/** Navigate editor to a document */
	openDocument: ( args: {
		type: 'template' | 'page' | 'template-part' | 'pattern';
		slug?: string;
		id?: number;
	} ) => Promise< { success: boolean; message: string } >;

	/** Get block tree */
	getBlocks: ( args?: {
		rootClientId?: string;
		blockName?: string;
	} ) => Promise< Block[] >;

	/** Insert blocks from serialized markup or block definition */
	insertBlocks: ( args: {
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
	} ) => Promise< { clientIds: string[] } >;

	/** Update block attributes */
	updateBlock: ( args: {
		clientId: string;
		attributes: Record< string, unknown >;
	} ) => Promise< { success: boolean } >;

	/** Remove blocks */
	removeBlocks: ( args: {
		clientIds: string[];
	} ) => Promise< { success: boolean } >;

	/** Replace blocks */
	replaceBlocks: ( args: {
		clientIds: string[];
		blocks: Array< {
			name: string;
			attributes?: Record< string, unknown >;
			innerBlocks?: Array< {
				name: string;
				attributes?: Record< string, unknown >;
			} >;
		} >;
	} ) => Promise< { success: boolean } >;

	/** Save / persist current edits */
	save: () => Promise< { success: boolean; message: string } >;

	/** Get theme.json styles */
	getStyles: () => Promise< ThemeStyles >;

	/** Update theme.json styles */
	setStyles: ( args: {
		settings?: Record< string, unknown >;
		styles?: Record< string, unknown >;
	} ) => Promise< { success: boolean } >;

	/** Capture screenshot (CDP only) */
	getScreenshot: ( args?: {
		selector?: string;
		fullPage?: boolean;
	} ) => Promise< { base64: string; mimeType: string } >;

	/** Get computed layout for blocks */
	getComputedLayout: ( args: {
		clientIds: string[];
		properties?: string[];
	} ) => Promise< ComputedLayout[] >;

	/** Parse block markup into block tree */
	parseMarkup: ( args: {
		markup: string;
	} ) => Promise< { blocks: Block[]; isValid: boolean } >;

	/** Export template as HTML */
	exportTemplate: () => Promise< { html: string } >;
}
