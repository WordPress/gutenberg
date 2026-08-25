/**
 * Loads the inference runtime.
 *
 * The runtime is fetched from a URL the host supplies rather than bundled with
 * this package, and that is a licensing decision rather than a size one.
 * ONNX Runtime's own code is MIT, but the WebAssembly binary it ships has
 * Apache-2.0 components compiled into it - flatbuffers and the ONNX reference
 * implementation among them - and Apache-2.0 is not GPLv2 compatible, so
 * WordPress cannot distribute it. Injecting it keeps that decision with
 * whoever is doing the distributing, and keeps this package's own dependency
 * tree GPLv2 clean.
 *
 * @see ../README.md for the alternatives that were measured.
 */

/**
 * A tensor handed to or returned by the runtime.
 */
export interface RuntimeTensor {
	data: Float32Array;
}

/**
 * A loaded model.
 */
export interface RuntimeSession {
	outputNames: string[];
	run: (
		feeds: Record< string, RuntimeTensor >
	) => Promise< Record< string, RuntimeTensor > >;
}

/**
 * The parts of the ONNX Runtime module this package uses.
 *
 * Typed here rather than imported so that nothing in the published package
 * points at the runtime, including its type declarations.
 */
export interface Runtime {
	env: {
		logLevel: string;
		wasm: {
			numThreads: number;
			wasmPaths: { wasm: string; mjs: string };
		};
	};
	Tensor: new (
		type: 'float32',
		data: Float32Array,
		dims: number[]
	) => RuntimeTensor;
	InferenceSession: {
		create: (
			model: ArrayBuffer,
			options: {
				executionProviders: string[];
				graphOptimizationLevel: string;
			}
		) => Promise< RuntimeSession >;
	};
}

/**
 * File name of the runtime module, as copied out of `onnxruntime-web`.
 */
const RUNTIME_FILE = 'ort.wasm.min.mjs';

/**
 * Resolves the caller's URL against the page and gives it a trailing slash.
 *
 * The runtime resolves the paths it is handed against its own location rather
 * than against the page, so a relative URL that works everywhere else comes
 * out doubled. Making it absolute once, here, keeps that from being something
 * every caller has to know.
 *
 * @param assetsUrl URL as the caller supplied it.
 * @return An absolute URL ending in a slash.
 */
export function normalizeAssetsUrl( assetsUrl: string ): string {
	const withSlash = assetsUrl.endsWith( '/' ) ? assetsUrl : `${ assetsUrl }/`;
	return new URL( withSlash, globalThis.location?.href ).href;
}

/**
 * One runtime per URL. Importing it compiles a WebAssembly module, so it is
 * worth doing once.
 */
const runtimes = new Map< string, Promise< Runtime > >();

/**
 * Loads the runtime from the given directory and points it at its binaries.
 *
 * @param assetsUrl Base URL, with a trailing slash.
 * @return The runtime module.
 */
export function loadRuntime( assetsUrl: string ): Promise< Runtime > {
	let runtime = runtimes.get( assetsUrl );

	if ( ! runtime ) {
		// The specifier is a variable so that bundlers leave it alone: this
		// resolves against the site at run time, not against node_modules at
		// build time.
		const url = `${ assetsUrl }${ RUNTIME_FILE }`;

		runtime = import( /* webpackIgnore: true */ /* @vite-ignore */ url )
			.then( ( module: Runtime ) => {
				module.env.logLevel = 'error';
				module.env.wasm.numThreads = 1;
				module.env.wasm.wasmPaths = {
					wasm: `${ assetsUrl }ort-wasm-simd-threaded.wasm`,
					mjs: `${ assetsUrl }ort-wasm-simd-threaded.mjs`,
				};
				return module;
			} )
			.catch( ( error ) => {
				// Do not cache a failure, so a transient one can be retried.
				runtimes.delete( assetsUrl );
				throw error;
			} );

		runtimes.set( assetsUrl, runtime );
	}

	return runtime;
}
