import { addFallbackToVar } from './ds-token-fallbacks.mjs';

const plugin = () => ( {
	postcssPlugin: 'postcss-ds-token-fallbacks',
	/** @param {import('postcss').Declaration} decl */
	Declaration( decl ) {
		const updated = addFallbackToVar( decl.value );
		if ( updated !== decl.value ) {
			decl.value = updated;
		}
	},
} );

plugin.postcss = true;

export default plugin;
