/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../use-recommended-components';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'use-recommended-components', rule, {
	valid: [
		// Unrelated packages are not affected.
		"import { Anything } from 'other-package';",
		"import { Button } from '@wordpress/components';",

		// Default and namespace imports are not affected.
		"import UI from '@wordpress/ui';",
		"import * as UI from '@wordpress/ui';",
	],

	invalid: [
		// @wordpress/ui has no recommended components yet, so all named imports are flagged.
		{
			code: "import { SomeComponent } from '@wordpress/ui';",
			errors: [
				{
					message:
						'`SomeComponent` from `@wordpress/ui` is not yet recommended for use in a WordPress environment.',
					type: 'ImportSpecifier',
				},
			],
		},
		{
			code: "import { Foo, Bar } from '@wordpress/ui';",
			errors: [
				{
					message:
						'`Foo` from `@wordpress/ui` is not yet recommended for use in a WordPress environment.',
					type: 'ImportSpecifier',
				},
				{
					message:
						'`Bar` from `@wordpress/ui` is not yet recommended for use in a WordPress environment.',
					type: 'ImportSpecifier',
				},
			],
		},
	],
} );
