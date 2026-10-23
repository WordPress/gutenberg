import { describe, expect, it } from 'vitest';
import { importsByNameOnlyInSource } from '../wordpress-externals-plugin.mjs';

describe( 'importsByNameOnlyInSource', () => {
	it.each( [
		[ "import { a } from '@wordpress/data';" ],
		[ "import { a, b as c } from '@wordpress/data';" ],
		[ "import {\n\ta,\n\tb,\n} from '@wordpress/data';" ],
		[ "import type { A } from '@wordpress/data';" ],
		[ "export { a } from '@wordpress/data';" ],
		[
			"import { a } from '@wordpress/data';\nimport * as b from '@wordpress/data-controls';\nexport * from './c';",
		],
		[ "import '@wordpress/data';" ],
		[ "import { a } from 'react';" ],
	] )( 'returns true for %j', ( source ) => {
		const specifier = source.includes( "'react'" )
			? 'react'
			: '@wordpress/data';
		expect( importsByNameOnlyInSource( source, specifier ) ).toBe( true );
	} );

	it.each( [
		[ "import * as data from '@wordpress/data';" ],
		[ "import*as data from'@wordpress/data'" ],
		[ "export * from '@wordpress/data';" ],
		[ "export * as data from '@wordpress/data';" ],
		[ "import data from '@wordpress/data';" ],
		[ "import data, { a } from '@wordpress/data';" ],
		[ "import { default as data } from '@wordpress/data';" ],
		[ "export { default } from '@wordpress/data';" ],
		[
			'import { a } from \'@wordpress/data\';\nimport * as data from "@wordpress/data";',
		],
	] )( 'returns false for %j', ( source ) => {
		expect( importsByNameOnlyInSource( source, '@wordpress/data' ) ).toBe(
			false
		);
	} );
} );
