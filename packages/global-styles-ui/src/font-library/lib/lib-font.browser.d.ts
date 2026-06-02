// Type declarations for lib-font.browser.js
export class Font {
	constructor( name: string, options?: any );
	opentype: any;
	tables: any;
	onload?: ( event: { detail: { font: any } } ) => void;
	fromDataBuffer( buffer: ArrayBuffer | any, filename: string ): void;
	static create( name: string, options?: any ): Font;
	static load( url: string, options?: any ): Promise< Font >;
	static loadFromArrayBuffer( arrayBuffer: ArrayBuffer, options?: any ): Font;
}
