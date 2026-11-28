import { expect, test, vi } from 'vitest';
import { compileInlineStyle } from '../compile-inline-style.mjs';

const tokens = vi.hoisted( () => ( { fallback: '8px' } ) );

vi.mock(
	import( '@wordpress/theme-build-tools/postcss-plugins/postcss-ds-token-fallbacks' ),
	() => {
		const plugin = () => ( {
			postcssPlugin: 'test-token-fallbacks',
			Declaration( decl ) {
				decl.value = decl.value.replace(
					'var(--token)',
					`var(--token, ${ tokens.fallback })`
				);
			},
		} );
		plugin.postcss = true;
		return { default: plugin };
	}
);

async function compileClassNames() {
	const source = await compileInlineStyle( {
		cssModules: true,
		minify: false,
	} )(
		'.tab { gap: var(--token); }',
		import.meta.dirname,
		`${ import.meta.dirname }/style.module.css`
	);

	return JSON.parse( source.match( /export default (.*);/ )[ 1 ] );
}

test( 'CSS module class names change when only a token fallback changes', async () => {
	tokens.fallback = '8px';
	const before = await compileClassNames();
	tokens.fallback = '12px';
	const after = await compileClassNames();

	expect( after.tab ).not.toBe( before.tab );
} );
