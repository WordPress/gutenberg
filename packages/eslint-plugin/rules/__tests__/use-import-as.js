/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../use-import-as';

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

const withSuggestions = ( message, output, desc ) => ( {
	message,
	suggestions: [
		{
			desc,
			output,
		},
	],
} );

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
				import { unlock } from '../../lock-unlock';

				const { Badge: WCBadge = fallbackBadge } = unlock( privateApis );
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
				withSuggestions(
					'`VisuallyHidden` from `@wordpress/components` must be imported as `WCVisuallyHidden`.',
					"import { VisuallyHidden as WCVisuallyHidden } from '@wordpress/components';",
					'Import as `WCVisuallyHidden`.'
				),
			],
		},
		{
			code: "import { VisuallyHidden as Hidden } from '@wordpress/components';",
			options,
			errors: [
				withSuggestions(
					'`VisuallyHidden` from `@wordpress/components` must be imported as `WCVisuallyHidden`.',
					"import { VisuallyHidden as WCVisuallyHidden } from '@wordpress/components';",
					'Import as `WCVisuallyHidden`.'
				),
			],
		},
		{
			code: "import { Button, VisuallyHidden } from '@wordpress/components';",
			options,
			errors: [
				withSuggestions(
					'`VisuallyHidden` from `@wordpress/components` must be imported as `WCVisuallyHidden`.',
					"import { Button, VisuallyHidden as WCVisuallyHidden } from '@wordpress/components';",
					'Import as `WCVisuallyHidden`.'
				),
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
				withSuggestions(
					'`Badge` from `@wordpress/components` must be imported as `WCBadge`.',
					`
				import { privateApis as componentsPrivateApis } from '@wordpress/components';
				import { unlock } from '../../lock-unlock';

				const { Badge: WCBadge } = unlock( componentsPrivateApis );
			`,
					'Destructure as `WCBadge`.'
				),
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
				withSuggestions(
					'`Badge` from `@wordpress/components` must be imported as `WCBadge`.',
					`
				import { privateApis } from '@wordpress/components';
				import { unlock } from '../../lock-unlock';

				const { Badge: WCBadge } = unlock( privateApis );
			`,
					'Destructure as `WCBadge`.'
				),
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
				withSuggestions(
					'`Badge` from `@wordpress/components` must be imported as `WCBadge`.',
					`
				import { privateApis } from '@wordpress/components';
				import { unlock } from '../../lock-unlock';

				const { Badge: WCBadge = fallbackBadge } = unlock( privateApis );
			`,
					'Destructure as `WCBadge`.'
				),
			],
		},
		{
			code: `
				import { privateApis } from '@wordpress/components';
				import { unlock } from '../../lock-unlock';

				const { Badge = fallbackBadge } = unlock( privateApis );
			`,
			options,
			errors: [
				withSuggestions(
					'`Badge` from `@wordpress/components` must be imported as `WCBadge`.',
					`
				import { privateApis } from '@wordpress/components';
				import { unlock } from '../../lock-unlock';

				const { Badge: WCBadge = fallbackBadge } = unlock( privateApis );
			`,
					'Destructure as `WCBadge`.'
				),
			],
		},
	],
} );
