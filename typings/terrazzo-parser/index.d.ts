declare module '@terrazzo/parser' {
	export interface TokenNormalized {
		mode: Record< string, TokenNormalized >;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[ key: string ]: any;
	}

	export interface TransformHookOptions {
		tokens: Record< string, TokenNormalized >;
	}

	export interface BuildHookOptions {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		getTransforms: ( options: any ) => any[];
		outputFile: ( filename: string, contents: string ) => void;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		sources: any[];
	}

	export interface Plugin {
		name: string;
		transform?: ( options: TransformHookOptions ) => void | Promise< void >;
		build?: ( options: BuildHookOptions ) => void | Promise< void >;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		[ key: string ]: any;
	}
}
