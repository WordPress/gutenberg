import { addFallbackToVarInCSS } from './ds-token-fallbacks.mjs';

/** @type {import('postcss').PluginCreator<never>} */
const plugin = () => ( {
	postcssPlugin: 'postcss-ds-token-fallbacks',
	/** @param {import('postcss').Declaration} decl */
	Declaration( decl ) {
		const updated = addFallbackToVarInCSS( decl.value );
		if ( updated !== decl.value ) {
			decl.value = updated;
		}
	},
} );

plugin.postcss = true;

export default plugin;
