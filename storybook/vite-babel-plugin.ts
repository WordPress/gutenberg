import {
	type ParserOptions,
	type TransformOptions,
	transformAsync as transformWithBabel,
} from '@babel/core';
import { createFilter, type Plugin } from 'vite';

type BabelPluginOptions = Omit< TransformOptions, 'sourceMaps' > & {
	sourceMap?: boolean;
};

const shouldTransformWithBabel = createFilter( /\.[jt]sx?$/, /node_modules/ );

export default async function babelPlugin(
	rawOptions: BabelPluginOptions
): Promise< Plugin > {
	const { sourceMap = true, ...babelOptions } = rawOptions;

	return {
		name: 'transform-emotion-with-babel',
		enforce: 'pre',
		async transform( code: string, id: string ) {
			const [ filePath ] = id.split( '?' );
			if (
				! shouldTransformWithBabel( filePath ) ||
				! code.includes( '@emotion/' )
			) {
				return null;
			}

			const parserPlugins: NonNullable< ParserOptions[ 'plugins' ] > = [];
			if ( /\.[jt]sx$/.test( filePath ) ) {
				parserPlugins.push( 'jsx' );
			}
			if ( /\.tsx?$/.test( filePath ) ) {
				parserPlugins.push( 'typescript' );
			}

			const result = await transformWithBabel( code, {
				...babelOptions,
				babelrc: false,
				configFile: false,
				filename: id,
				parserOpts: {
					allowAwaitOutsideFunction: true,
					plugins: parserPlugins,
					sourceType: 'module',
					...babelOptions.parserOpts,
				},
				sourceFileName: filePath,
				sourceMaps: sourceMap,
			} );

			if ( typeof result?.code !== 'string' ) {
				throw new Error(
					`Storybook Babel: Babel produced no code for ${ filePath }.`
				);
			}

			return { code: result.code, map: result.map };
		},
	};
}
