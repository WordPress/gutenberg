import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from 'rolldown';
import { afterEach, describe, expect, it } from 'vitest';
import { translatorCommentsPlugin } from '../translator-comments-plugin.mjs';

describe( 'translatorCommentsPlugin()', () => {
	let temporaryDirectory;

	afterEach( () => {
		if ( temporaryDirectory ) {
			rmSync( temporaryDirectory, { force: true, recursive: true } );
			temporaryDirectory = undefined;
		}
	} );

	it( 'keeps translator comments next to their strings in the output', async () => {
		temporaryDirectory = mkdtempSync(
			path.join( os.tmpdir(), 'wordpress-build-translator-comments-' )
		);
		const input = path.join( temporaryDirectory, 'index.jsx' );
		writeFileSync(
			input,
			[
				"import { __, sprintf } from '@wordpress/i18n';",
				'export function Label( { isPending, count } ) {',
				'	/* translators: Button label. */',
				"	const label = isPending ? __( 'Save as pending' ) : __( 'Save draft' );",
				'	return (',
				'		<button',
				'			// translators: %d: Number of items.',
				"			title={ sprintf( __( '%d items' ), count ) }",
				'			data-note="/* translators: Not a comment. */"',
				'		>',
				'			{ label }',
				'		</button>',
				'	);',
				'}',
			].join( '\n' )
		);

		const { output } = await build( {
			input,
			external: [ '@wordpress/i18n', 'react/jsx-runtime' ],
			logLevel: 'silent',
			plugins: [ translatorCommentsPlugin() ],
			write: false,
			output: { format: 'esm' },
		} );
		const lines = output[ 0 ].code
			.split( '\n' )
			.map( ( line ) => line.trim() );
		const lineAfter = ( comment ) => lines[ lines.indexOf( comment ) + 1 ];

		expect( lineAfter( '/** translators: Button label. */' ) ).toBe(
			'const label = isPending ? __("Save as pending") : __("Save draft");'
		);
		expect( lineAfter( '/** translators: %d: Number of items. */' ) ).toBe(
			'title: sprintf(__("%d items"), count),'
		);
		expect( output[ 0 ].code ).toContain(
			'"data-note": "/* translators: Not a comment. */"'
		);
	} );
} );
