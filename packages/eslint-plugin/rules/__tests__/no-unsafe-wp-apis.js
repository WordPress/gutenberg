/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-unsafe-wp-apis';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

const options = [ { '@wordpress/safe': [ '__experimentalSafe' ] } ];

ruleTester.run( 'wp-no-unsafe-features', rule, {
	valid: [
		{ code: "import _ from 'lodash';", options },
		{ code: "import { map } from 'lodash';", options },
		{ code: "import { __experimentalFoo } from 'lodash';", options },
		{ code: "import { __unstableFoo } from 'lodash';", options },
		{ code: "import _, { __unstableFoo } from 'lodash';", options },
		{ code: "import * as _ from 'lodash';", options },

		{ code: "import _ from './x';", options },
		{ code: "import { map } from './x';", options },
		{ code: "import { __experimentalFoo } from './x';", options },
		{ code: "import { __unstableFoo } from './x';", options },
		{ code: "import _, { __unstableFoo } from './x';", options },
		{ code: "import * as _ from './x';", options },

		{ code: "import s from '@wordpress/safe';", options },
		{ code: "import { feature } from '@wordpress/safe';", options },
		{
			code: "import { __experimentalSafe } from '@wordpress/safe';",
			options,
		},
		{
			code:
				"import { feature, __experimentalSafe } from '@wordpress/safe';",
			options,
		},
		{
			code: "import s, { __experimentalSafe } from '@wordpress/safe';",
			options,
		},
		{ code: "import * as s from '@wordpress/safe';", options },
	],

	invalid: [
		{
			code: "import { __experimentalUnsafe } from '@wordpress/safe';",
			options,
			errors: [
				{
					message:
						'Usage of `__experimentalUnsafe` from `@wordpress/safe` is not allowed',
					type: 'ImportSpecifier',
				},
			],
		},
		{
			code: "import { __experimentalSafe } from '@wordpress/unsafe';",
			options,
			errors: [
				{
					message:
						'Usage of `__experimentalSafe` from `@wordpress/unsafe` is not allowed',
					type: 'ImportSpecifier',
				},
			],
		},
		{
			code:
				"import { feature, __experimentalSafe } from '@wordpress/unsafe';",
			options,
			errors: [
				{
					message:
						'Usage of `__experimentalSafe` from `@wordpress/unsafe` is not allowed',
					type: 'ImportSpecifier',
				},
			],
		},
		{
			code: "import s, { __experimentalUnsafe } from '@wordpress/safe';",
			options,
			errors: [
				{
					message:
						'Usage of `__experimentalUnsafe` from `@wordpress/safe` is not allowed',
					type: 'ImportSpecifier',
				},
			],
		},
		{
			code: "import { __unstableIsNeverSafe } from '@wordpress/safe';",
			options,
			errors: [
				{
					message:
						'Usage of `__unstableIsNeverSafe` from `@wordpress/safe` is not allowed',
					type: 'ImportSpecifier',
				},
			],
		},
	],
} );
