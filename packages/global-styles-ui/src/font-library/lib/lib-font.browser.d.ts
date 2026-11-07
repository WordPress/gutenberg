/**
 * Type declarations for lib-font.browser.js.
 *
 * Only the parts of the font tables that are read in this package are typed.
 * Every table is optional: parsing succeeds for a font that lacks any of them.
 */

export interface FontOptions {
	skipStyleSheet?: boolean;
	errorOnStyle?: boolean;
	styleRules?: Record< string, string >;
}

export interface FontEvent< Detail = { font: Font } > {
	type: string;
	detail: Detail;
	msg?: string;
	preventDefault(): void;
	stopPropagation(): void;
}

export interface NameTable {
	get( nameID: number ): string | undefined;
}

export interface OS2Table {
	usWeightClass: number;
	sTypoAscender: number;
	sTypoDescender: number;
}

export interface VariationAxisRecord {
	tag: string;
	minValue: number;
	defaultValue: number;
	maxValue: number;
	axisNameID: number;
}

export interface FvarTable {
	axes: VariationAxisRecord[];
	getSupportedAxes(): string[];
	getAxis( name: string ): VariationAxisRecord | undefined;
}

export interface FontTables {
	name?: NameTable;
	'OS/2'?: OS2Table;
	fvar?: FvarTable;
	[ tag: string ]: unknown;
}

export interface OpenTypeData {
	tables: FontTables;
}

export declare class Font {
	constructor( name: string, options?: FontOptions );
	name: string;
	options: FontOptions;
	src: string | undefined;
	opentype: OpenTypeData;
	onload?: ( event: FontEvent ) => void;
	onunload?: ( event: FontEvent ) => void;
	onerror?: ( event: FontEvent< unknown > ) => void;
	addEventListener(
		type: string,
		listener: ( event: FontEvent< unknown > ) => void,
		useCapture?: boolean
	): void;
	removeEventListener(
		type: string,
		listener: ( event: FontEvent< unknown > ) => void
	): void;
	loadFont( url: string, filename?: string ): Promise< void >;
	fromDataBuffer(
		buffer: ArrayBuffer,
		filenameOrUrL: string
	): Promise< void >;
	supports( char: string ): boolean;
	unload(): void;
	load(): void;
}
