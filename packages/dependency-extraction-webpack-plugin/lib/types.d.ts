import { Compiler } from 'webpack';

export = DependencyExtractionWebpackPlugin;

declare class DependencyExtractionWebpackPlugin {
	constructor( options: DependencyExtractionWebpackPluginOptions );
	apply( compiler: Compiler ): void;
}

declare interface DependencyExtractionWebpackPluginOptions {
	injectPolyfill?: boolean;
	useDefaults?: boolean;
	outputFormat?: 'php' | 'json';
	requestToExternal?: ( request: string ) => string | string[] | undefined;
	requestToHandle?: ( request: string ) => string | undefined;
	combinedOutputFile?: string | null;
	combineAssets?: boolean;
}
