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

const options = [
	{ '@wordpress/package': [ '__experimentalSafe', '__unstableSafe' ] },
];

ruleTester.run( 'no-unsafe-wp-apis', rule, {
	valid: [
		{ code: "import _ from 'change-case';", options },
		{ code: "import { camelCase } from 'change-case';", options },
		{ code: "import { __experimentalFoo } from 'change-case';", options },
		{ code: "import { __unstableFoo } from 'change-case';", options },
		{ code: "import _, { __unstableFoo } from 'change-case';", options },
		{ code: "import * as _ from 'change-case';", options },

		{ code: "import _ from './x';", options },
		{ code: "import { camelCase } from './x';", options },
		{ code: "import { __experimentalFoo } from './x';", options },
		{ code: "import { __unstableFoo } from './x';", options },
		{ code: "import _, { __unstableFoo } from './x';", options },
		{ code: "import * as _ from './x';", options },

		{ code: "import s from '@wordpress/package';", options },
		{ code: "import { feature } from '@wordpress/package';", options },
		{
			code: "import { __experimentalSafe } from '@wordpress/package';",
			options,
		},
		{
			code: "import { __unstableSafe } from '@wordpress/package';",
			options,
		},
		{
			code: "import { feature, __experimentalSafe } from '@wordpress/package';",
			options,
		},
		{
			code: "import s, { __experimentalSafe } from '@wordpress/package';",
			options,
		},
		{ code: "import * as s from '@wordpress/package';", options },
	],

	invalid: [
		{
			code: "import { __experimentalUnsafe } from '@wordpress/package';",
			options,
			errors: [
				{
					message: `Usage of \`__experimentalUnsafe\` from \`@wordpress/package\` is not allowed.
See https://developer.wordpress.org/block-editor/contributors/develop/coding-guidelines/#experimental-and-unstable-apis for details.`,
					type: 'ImportSpecifier',
				},
			],
		},
		{
			code: "import { __experimentalSafe } from '@wordpress/unsafe';",
			options,
			errors: [
				{
					message: `Usage of \`__experimentalSafe\` from \`@wordpress/unsafe\` is not allowed.
See https://developer.wordpress.org/block-editor/contributors/develop/coding-guidelines/#experimental-and-unstable-apis for details.`,
					type: 'ImportSpecifier',
				},
			],
		},
		{
			code: "import { feature, __experimentalSafe } from '@wordpress/unsafe';",
			options,
			errors: [
				{
					message: `Usage of \`__experimentalSafe\` from \`@wordpress/unsafe\` is not allowed.
See https://developer.wordpress.org/block-editor/contributors/develop/coding-guidelines/#experimental-and-unstable-apis for details.`,
					type: 'ImportSpecifier',
				},
			],
		},
		{
			code: "import s, { __experimentalUnsafe } from '@wordpress/package';",
			options,
			errors: [
				{
					message: `Usage of \`__experimentalUnsafe\` from \`@wordpress/package\` is not allowed.
See https://developer.wordpress.org/block-editor/contributors/develop/coding-guidelines/#experimental-and-unstable-apis for details.`,
					type: 'ImportSpecifier',
				},
			],
		},
		{
			code: "import { __unstableFeature } from '@wordpress/package';",
			options,
			errors: [
				{
					message: `Usage of \`__unstableFeature\` from \`@wordpress/package\` is not allowed.
See https://developer.wordpress.org/block-editor/contributors/develop/coding-guidelines/#experimental-and-unstable-apis for details.`,
					type: 'ImportSpecifier',
				},
			],
		},
	],
} );
