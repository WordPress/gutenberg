/**
 * Type declarations for vendor files (wasm-vips).
 *
 * The vendor directory contains pre-built wasm-vips files without TypeScript
 * definitions. This file provides the necessary type information.
 */

// wasm-vips module types
declare module '../vendor/vips-es6.js' {
	interface VipsImage {
		width: number;
		height: number;
		pageHeight: number;
		getFields: () => string[];
		getInt: ( name: string ) => number | undefined;
		get: ( name: string ) => unknown;
		set: ( name: string, value: unknown ) => void;
		crop: (
			left: number,
			top: number,
			width: number,
			height: number
		) => VipsImage;
		writeToBuffer: ( suffix: string, options?: SaveOptions ) => Buffer;
		remove: ( name: string ) => void;
		delete: () => void;
	}

	interface VipsImageStatic {
		thumbnailBuffer: (
			buffer: ArrayBuffer,
			width: number,
			options?: ThumbnailOptions
		) => VipsImage;
		newFromBuffer: ( buffer: ArrayBuffer, options?: string ) => VipsImage;
	}

	interface VipsModule {
		Image: VipsImageStatic;
	}

	interface SaveOptions {
		Q?: number;
		strip?: boolean;
		interlace?: boolean;
		lossless?: boolean;
	}

	interface ThumbnailOptions {
		height?: number;
		size?: string;
		crop?: string;
	}

	interface EmscriptenModule {
		setAutoDeleteLater: ( autoDelete: boolean ) => void;
		setDelayFunction: ( fn: ( fn: () => void ) => void ) => void;
	}

	interface VipsOptions {
		locateFile?: ( fileName: string ) => string;
		preRun?: ( module: EmscriptenModule ) => void;
	}

	type Vips = ( options?: VipsOptions ) => Promise< VipsModule >;

	const vips: Vips;
	export default vips;
}

// WASM module types
declare module '../vendor/vips.wasm' {
	const url: string;
	export default url;
}

declare module '../vendor/vips-heif.wasm' {
	const url: string;
	export default url;
}

declare module '../vendor/vips-jxl.wasm' {
	const url: string;
	export default url;
}
