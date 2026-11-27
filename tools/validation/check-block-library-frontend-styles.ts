#!/usr/bin/env node

/**
 * Fails when a built block-library stylesheet that loads on the site frontend
 * references an admin design token.
 *
 * The built files are checked, not the sources, so that tokens coming from
 * `@wordpress/base-styles` mixins are caught too. Only `var()` references are
 * reported: `common.css` defines `--wp-admin-theme-color` at `:root` for
 * backward compatibility without using it.
 *
 * Usage, after `npm run build`:
 *   node tools/validation/check-block-library-frontend-styles.ts [build-style-dir]
 */

import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';

const ROOT = path.resolve( import.meta.dirname, '../..' );
const DEFAULT_BUILD_STYLE_DIR = path.join(
	ROOT,
	'packages/block-library/build-style'
);

/*
 * Mirrors the frontend registrations in `gutenberg_register_packages_styles()`
 * (`lib/client-assets.php`) and `lib/blocks.php`. `reset.css` is left out
 * because only the editor loads it, as `wp-reset-editor-styles`. `elements.css`
 * is left out because it is not enqueued on its own and is already part of
 * `common.css` and `style.css`. The `-rtl` variants are checked too, because
 * RTLCSS directives such as `rtl:raw` can add declarations to them alone.
 */
const FRONTEND_STYLESHEETS = [
	'{style,common,theme,classic}{,-rtl}.css',
	'*/{style,theme}{,-rtl}.css',
];

type AdminToken = {
	prefix: string;
	reason: string;
};

type TokenReference = {
	token: string;
	line: number;
	adminToken: AdminToken;
};

const ADMIN_TOKENS: AdminToken[] = [
	{
		prefix: '--wpds-',
		reason: 'Design System tokens (`--wpds-*`) are not loaded on the frontend, so the build-time fallback applies there while the editor shows the live token value.',
	},
	{
		prefix: '--wp-components-',
		reason: 'Component variables (`--wp-components-*`) are defined by the components stylesheet, which is not loaded on the frontend.',
	},
	{
		prefix: '--wp-admin-theme-color',
		reason: 'The admin theme color (`--wp-admin-theme-color*`) follows the admin color scheme in the editor but keeps its default value on the frontend.',
	},
	{
		prefix: '--wp-admin-border-width-focus',
		reason: 'The admin focus width (`--wp-admin-border-width-focus`) belongs to the admin styles and is defined on the frontend only for backward compatibility.',
	},
];

const VAR_REFERENCE = /var\(\s*(--[\w-]+)/iy;

// Scans rather than matching the whole file so that `var()` inside comments
// and strings is skipped.
function findAdminTokenReferences( css: string ): TokenReference[] {
	const references: TokenReference[] = [];
	let line = 1;
	for ( let index = 0; index < css.length; index++ ) {
		const character = css[ index ];

		if ( character === '/' && css[ index + 1 ] === '*' ) {
			const end = css.indexOf( '*/', index + 2 );
			const next = end === -1 ? css.length : end + 2;
			line += css.slice( index, next ).split( '\n' ).length - 1;
			index = next - 1;
		} else if ( character === '"' || character === "'" ) {
			index++;
			while ( index < css.length && css[ index ] !== character ) {
				if ( css[ index ] === '\\' ) {
					index++;
				}
				if ( css[ index ] === '\n' ) {
					line++;
				}
				index++;
			}
		} else if ( character === '\n' ) {
			line++;
		} else if ( ! /[\w-]/.test( css[ index - 1 ] ?? '' ) ) {
			VAR_REFERENCE.lastIndex = index;
			const token = VAR_REFERENCE.exec( css )?.[ 1 ];
			const adminToken =
				token &&
				ADMIN_TOKENS.find( ( { prefix } ) =>
					token.startsWith( prefix )
				);
			if ( adminToken ) {
				references.push( { token, line, adminToken } );
			}
		}
	}
	return references;
}

const buildStyleDir = path.resolve(
	process.argv[ 2 ] ?? DEFAULT_BUILD_STYLE_DIR
);

if ( ! fs.existsSync( path.join( buildStyleDir, 'style.css' ) ) ) {
	console.error(
		`error: no built block-library styles in ${ buildStyleDir }. Run \`npm run build\` first.`
	);
	process.exit( 2 );
}

const files = (
	await glob( FRONTEND_STYLESHEETS, { cwd: buildStyleDir, posix: true } )
).sort();

let failures = 0;
const reasons = new Set< string >();
for ( const file of files ) {
	const css = fs.readFileSync( path.join( buildStyleDir, file ), 'utf8' );
	for ( const { token, line, adminToken } of findAdminTokenReferences(
		css
	) ) {
		failures++;
		reasons.add( adminToken.reason );
		console.error( `${ file }:${ line }: ${ token }` );
	}
}

if ( failures > 0 ) {
	console.error(
		[
			'',
			`Found ${ failures } admin design token reference${
				failures === 1 ? '' : 's'
			} in block-library stylesheets that load on the frontend.`,
			...reasons,
			'Use a `theme.json` preset (`--wp--preset--*`) or a literal value in the block’s `style.scss` or `theme.scss` instead. If the token comes from a `@wordpress/base-styles` mixin, replace the mixin there. Rules that only apply in the editor belong in `editor.scss`.',
		].join( '\n' )
	);
	process.exit( 1 );
}

console.log(
	`Checked ${ files.length } frontend block-library stylesheets: no admin design tokens found.`
);
