import { RuleTester } from 'eslint';
import rule from '../components-no-unsafe-button-disabled';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
		ecmaFeatures: {
			jsx: true,
		},
	},
} );

ruleTester.run( 'components-no-unsafe-button-disabled', rule, {
	valid: [
		// Button with both disabled and accessibleWhenDisabled
		{
			code: `
				import { Button } from '@wordpress/components';
				<Button disabled accessibleWhenDisabled />
			`,
		},
		// Button with accessibleWhenDisabled={true}
		{
			code: `
				import { Button } from '@wordpress/components';
				<Button disabled accessibleWhenDisabled={true} />
			`,
		},
		// Button with accessibleWhenDisabled={false}
		{
			code: `
						import { Button } from '@wordpress/components';
						<Button disabled accessibleWhenDisabled={false} />
					`,
		},
		// Button with accessibleWhenDisabled={someVar}
		{
			code: `
				import { Button } from '@wordpress/components';
				<Button disabled accessibleWhenDisabled={someVar} />
			`,
		},
		// Button with accessibleWhenDisabled={false} should error (handled in invalid)
		// Button with disabled={false} should not require accessibleWhenDisabled
		{
			code: `
				import { Button } from '@wordpress/components';
				<Button disabled={false} />
			`,
		},
		// Button with disabled={someVar} and accessibleWhenDisabled={someVar}
		{
			code: `
						import { Button } from '@wordpress/components';
						<Button disabled={isDisabled} accessibleWhenDisabled={someVar} />
					`,
		},
		// Button without disabled prop
		{
			code: `
				import { Button } from '@wordpress/components';
				<Button onClick={handleClick} />
			`,
		},
		// Button from @wordpress/ui (should not be checked)
		{
			code: `
				import { Button } from '@wordpress/ui';
				<Button disabled />
			`,
		},
		// Local Button component (should not be checked)
		{
			code: `
				const Button = () => <button />;
				<Button disabled />
			`,
		},
		// Button from another package (should not be checked)
		{
			code: `
				import { Button } from 'some-other-package';
				<Button disabled />
			`,
		},
		// Aliased import with correct props
		{
			code: `
				import { Button as WPButton } from '@wordpress/components';
				<WPButton disabled accessibleWhenDisabled />
			`,
		},
		// Non-Button component with disabled (should not be checked)
		{
			code: `
				import { TextControl } from '@wordpress/components';
				<TextControl disabled />
			`,
		},
	],
	invalid: [
		// Button with disabled but no accessibleWhenDisabled
		{
			code: `
				import { Button } from '@wordpress/components';
				<Button disabled />
			`,
			errors: [
				{
					messageId: 'missingAccessibleWhenDisabled',
				},
			],
		},
		// Button with disabled={someVar} but no accessibleWhenDisabled
		{
			code: `
				import { Button } from '@wordpress/components';
				<Button disabled={isDisabled} />
			`,
			errors: [
				{
					messageId: 'missingAccessibleWhenDisabled',
				},
			],
		},
		// Button with disabled={true} but no accessibleWhenDisabled
		{
			code: `
				import { Button } from '@wordpress/components';
				<Button disabled={true} />
			`,
			errors: [
				{
					messageId: 'missingAccessibleWhenDisabled',
				},
			],
		},
		// Aliased import without accessibleWhenDisabled
		{
			code: `
				import { Button as MyButton } from '@wordpress/components';
				<MyButton disabled />
			`,
			errors: [
				{
					messageId: 'missingAccessibleWhenDisabled',
				},
			],
		},
		// Multiple Buttons, one invalid
		{
			code: `
				import { Button } from '@wordpress/components';
				<>
					<Button disabled accessibleWhenDisabled />
					<Button disabled />
				</>
			`,
			errors: [
				{
					messageId: 'missingAccessibleWhenDisabled',
				},
			],
		},
	],
} );

// Additional tests for checkLocalImports option
ruleTester.run(
	'components-no-unsafe-button-disabled (checkLocalImports)',
	rule,
	{
		valid: [
			// Relative import with correct props
			{
				code: `
				import { Button } from '../button';
				<Button disabled accessibleWhenDisabled />
			`,
				options: [ { checkLocalImports: true } ],
			},
			// Default import with correct props
			{
				code: `
				import Button from './button';
				<Button disabled accessibleWhenDisabled />
			`,
				options: [ { checkLocalImports: true } ],
			},
			// Relative import without checkLocalImports (should not be checked)
			{
				code: `
				import { Button } from '../button';
				<Button disabled />
			`,
			},
			// Default import without checkLocalImports (should not be checked)
			{
				code: `
				import Button from '../button';
				<Button disabled />
			`,
			},
		],
		invalid: [
			// Relative import with checkLocalImports enabled
			{
				code: `
				import { Button } from '../button';
				<Button disabled />
			`,
				options: [ { checkLocalImports: true } ],
				errors: [
					{
						messageId: 'missingAccessibleWhenDisabled',
					},
				],
			},
			// Default import from button path with checkLocalImports enabled
			{
				code: `
				import Button from '../button';
				<Button disabled />
			`,
				options: [ { checkLocalImports: true } ],
				errors: [
					{
						messageId: 'missingAccessibleWhenDisabled',
					},
				],
			},
		],
	}
);
