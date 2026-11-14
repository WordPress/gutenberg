/**
 * Type declarations for lib-font.browser.js.
 *
 * Only what this package reads is typed. A table is missing when the font lacks it.
 */

export interface FontEvent {
	detail: { font: Font };
}

export interface FontTables {
	name?: { get( nameID: number ): string | undefined };
	'OS/2'?: { usWeightClass: number };
	fvar?: {
		axes: Array< { tag: string; minValue: number; maxValue: number } >;
	};
}

export declare class Font {
	constructor( name: string );
	opentype: { tables: FontTables };
	onload?: ( event: FontEvent ) => void;
	fromDataBuffer(
		buffer: ArrayBuffer,
		filenameOrUrL: string
	): Promise< void >;
}
