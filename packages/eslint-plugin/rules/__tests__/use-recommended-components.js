/* eslint-env jest */

/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule, { ALLOWLIST, DENYLIST } from '../use-recommended-components';

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

		// Allowed @wordpress/ui components.
		"import { Badge } from '@wordpress/ui';",
		"import { Stack } from '@wordpress/ui';",
		"import { Badge, Stack } from '@wordpress/ui';",
	],

	invalid: [
		// Allowlist: non-allowed @wordpress/ui imports are flagged.
		{
			code: "import { SomeComponent } from '@wordpress/ui';",
			errors: [
				{
					message:
						'`SomeComponent` from `@wordpress/ui` is not yet recommended for use in a WordPress environment.',
				},
			],
		},
		{
			code: "import { Foo, Bar } from '@wordpress/ui';",
			errors: [
				{
					message:
						'`Foo` from `@wordpress/ui` is not yet recommended for use in a WordPress environment.',
				},
				{
					message:
						'`Bar` from `@wordpress/ui` is not yet recommended for use in a WordPress environment.',
				},
			],
		},
		// Denylist: denied components are flagged with their message.
		{
			code: "import { __experimentalZStack } from '@wordpress/components';",
			errors: [
				{
					message:
						'__experimentalZStack is planned for deprecation. Write your own CSS instead.',
				},
			],
		},
		{
			code: "import { __experimentalZStack as ZStack } from '@wordpress/components';",
			errors: [
				{
					message:
						'__experimentalZStack is planned for deprecation. Write your own CSS instead.',
				},
			],
		},
	],
} );

describe( 'ALLOWLIST and DENYLIST', () => {
	it( 'should not have overlapping package keys', () => {
		const allowlistPackages = Object.keys( ALLOWLIST );
		const denylistPackages = Object.keys( DENYLIST );
		const overlap = allowlistPackages.filter( ( pkg ) =>
			denylistPackages.includes( pkg )
		);
		expect( overlap ).toEqual( [] );
	} );
} );
