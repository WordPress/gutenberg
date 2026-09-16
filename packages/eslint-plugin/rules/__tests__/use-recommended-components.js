import { describe, expect, it } from 'vitest';
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule, { ALLOWLIST, DENYLIST } from '../use-recommended-components';

const RuleTester = configureRuleTester( { describe, it } );

const ruleTester = new RuleTester( {
	languageOptions: {
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

		// Unlocked private APIs are only checked for denied names.
		"import { privateApis } from '@wordpress/components'; import { unlock } from '../../lock-unlock'; const { SomethingElse } = unlock( privateApis );",
		`
			import { privateApis } from '@wordpress/components';
			import { unlock } from '../../lock-unlock';

			function test() {
				function unlock( value ) {
					return value;
				}

				const { Tabs } = unlock( privateApis );

				return Tabs;
			}
		`,
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
		{
			code: "import { privateApis } from '@wordpress/components'; import { unlock } from '../../lock-unlock'; const { Tabs } = unlock( privateApis );",
			errors: [
				{
					message: 'Use `Tabs` from `@wordpress/ui` instead.',
				},
			],
		},
		{
			code: "import { privateApis as componentsPrivateApis } from '@wordpress/components'; import { unlock } from '../../lock-unlock'; const { Tabs: WCTabs } = unlock( componentsPrivateApis );",
			errors: [
				{
					message: 'Use `Tabs` from `@wordpress/ui` instead.',
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
