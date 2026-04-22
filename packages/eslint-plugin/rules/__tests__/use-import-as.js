/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../use-import-as';

if ( typeof globalThis.structuredClone !== 'function' ) {
	globalThis.structuredClone = ( value ) =>
		JSON.parse( JSON.stringify( value ) );
}

const ruleTester = new RuleTester( {
	languageOptions: {
		sourceType: 'module',
		ecmaVersion: 2022,
	},
} );

const options = [
	{
		'@wordpress/components': {
			Badge: 'WCBadge',
			VisuallyHidden: 'WCVisuallyHidden',
		},
	},
];

ruleTester.run( 'use-import-as', rule, {
	valid: [
		// With no config, the rule is a no-op.
		{
			code: "import { VisuallyHidden } from '@wordpress/components';",
		},

		// Unrelated packages are not affected.
		{
			code: "import { VisuallyHidden } from '@wordpress/ui';",
			options,
		},
		{
			code: "import { Button } from '@wordpress/components';",
			options,
		},

		// Default and namespace imports are not affected.
		{
			code: "import Components from '@wordpress/components';",
			options,
		},
		{
			code: "import * as Components from '@wordpress/components';",
			options,
		},

		// Configured `as` names are allowed.
		{
			code: "import { VisuallyHidden as WCVisuallyHidden } from '@wordpress/components';",
			options,
		},
		{
			code: 'import { "VisuallyHidden" as WCVisuallyHidden } from \'@wordpress/components\';',
			options,
		},
		{
			code: "import { Button, VisuallyHidden as WCVisuallyHidden } from '@wordpress/components';",
			options,
		},
		{
			code: `
				import { privateApis as componentsPrivateApis } from '@wordpress/components';
				import { unlock } from '../../lock-unlock';

				const { Badge: WCBadge } = unlock( componentsPrivateApis );
			`,
			options,
		},
		{
			code: `
				import { privateApis } from '@wordpress/components';
				import { unlock } from '../../lock-unlock';

				const { Badge: WCBadge } = unlock( privateApis );
			`,
			options,
		},
		{
			code: `
				import { privateApis } from '@wordpress/components';
				import { unlock as open } from '../../lock-unlock';

				const { Badge: WCBadge = fallbackBadge } = open( privateApis );
			`,
			options,
		},
		{
			code: `
				import { privateApis as uiPrivateApis } from '@wordpress/ui';
				import { unlock } from '../../lock-unlock';

				const { Badge } = unlock( uiPrivateApis );
			`,
			options,
		},
		{
			code: `
				import { privateApis } from '@wordpress/components';
				import { unlock } from '../../lock-unlock';

				const { [ badgeKey ]: Badge } = unlock( privateApis );
			`,
			options,
		},
		{
			code: `
				import { privateApis } from '@wordpress/components';
				import { unlock } from '../../lock-unlock';

				function test() {
					function unlock( value ) {
						return value;
					}

					const { Badge } = unlock( privateApis );

					return Badge;
				}
			`,
			options,
		},
	],

	invalid: [
		{
			code: "import { VisuallyHidden } from '@wordpress/components';",
			options,
			errors: [
				{
					message:
						'`VisuallyHidden` from `@wordpress/components` must be imported as `WCVisuallyHidden`.',
				},
			],
		},
		{
			code: "import { VisuallyHidden as Hidden } from '@wordpress/components';",
			options,
			errors: [
				{
					message:
						'`VisuallyHidden` from `@wordpress/components` must be imported as `WCVisuallyHidden`.',
				},
			],
		},
		{
			code: 'import { "VisuallyHidden" as Hidden } from \'@wordpress/components\';',
			options,
			errors: [
				{
					message:
						'`VisuallyHidden` from `@wordpress/components` must be imported as `WCVisuallyHidden`.',
				},
			],
		},
		{
			code: "import { Button, VisuallyHidden } from '@wordpress/components';",
			options,
			errors: [
				{
					message:
						'`VisuallyHidden` from `@wordpress/components` must be imported as `WCVisuallyHidden`.',
				},
			],
		},
		{
			code: `
				import { privateApis as componentsPrivateApis } from '@wordpress/components';
				import { unlock } from '../../lock-unlock';

				const { Badge } = unlock( componentsPrivateApis );
			`,
			options,
			errors: [
				{
					message:
						'`Badge` from `@wordpress/components` must be imported as `WCBadge`.',
				},
			],
		},
		{
			code: `
				import { privateApis } from '@wordpress/components';
				import { unlock } from '../../lock-unlock';

				const { Badge: HiddenBadge } = unlock( privateApis );
			`,
			options,
			errors: [
				{
					message:
						'`Badge` from `@wordpress/components` must be imported as `WCBadge`.',
				},
			],
		},
		{
			code: `
				import { privateApis } from '@wordpress/components';
				import { unlock } from '../../lock-unlock';

				const { Badge: HiddenBadge = fallbackBadge } = unlock( privateApis );
			`,
			options,
			errors: [
				{
					message:
						'`Badge` from `@wordpress/components` must be imported as `WCBadge`.',
				},
			],
		},
	],
} );
