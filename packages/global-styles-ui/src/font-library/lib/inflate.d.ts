/**
 * Type declarations for inflate.js, a vendored build of pako 1.0.10's inflate module.
 */

export type InflateInput =
	Uint8Array | ArrayLike< number > | ArrayBuffer | string;

export interface InflateOptions {
	windowBits?: number;
	raw?: boolean;
	chunkSize?: number;
	dictionary?: InflateInput;
	to?: 'string';
}

declare class Inflate {
	constructor( options?: InflateOptions );
	err: number;
	msg: string;
	result: Uint8Array | string | undefined;
	push( data: InflateInput, mode?: number | boolean ): boolean;
}

type InflateFunction = {
	( input: InflateInput, options: InflateOptions & { to: 'string' } ): string;
	(
		input: InflateInput,
		options?: InflateOptions & { to?: undefined }
	): Uint8Array;
	( input: InflateInput, options: InflateOptions ): Uint8Array | string;
};

declare const pako: {
	Inflate: typeof Inflate;
	inflate: InflateFunction;
	inflateRaw: InflateFunction;
	ungzip: InflateFunction;
};

export default pako;
