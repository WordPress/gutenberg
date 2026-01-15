import { RuleTester } from 'eslint';
import rule from '../components-no-missing-40px-size-prop';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
		ecmaFeatures: {
			jsx: true,
		},
	},
} );

ruleTester.run( 'components-no-missing-40px-size-prop', rule, {
	valid: [
		// Component with __next40pxDefaultSize (boolean attribute)
		{
			code: `
				import { Button } from '@wordpress/components';
				<Button __next40pxDefaultSize />
			`,
		},
		// Component with __next40pxDefaultSize={true}
		{
			code: `
				import { InputControl } from '@wordpress/components';
				<InputControl __next40pxDefaultSize={true} />
			`,
		},
		// Component with non-default size prop
		{
			code: `
				import { Button } from '@wordpress/components';
				<Button size="small" />
			`,
		},
		// Component with size="compact"
		{
			code: `
				import { SelectControl } from '@wordpress/components';
				<SelectControl size="compact" />
			`,
		},
		// Component from @wordpress/ui (should not be checked)
		{
			code: `
				import { Button } from '@wordpress/ui';
				<Button />
			`,
		},
		// Local component (should not be checked)
		{
			code: `
				const Button = () => <button />;
				<Button />
			`,
		},
		// Component from another package (should not be checked)
		{
			code: `
				import { Button } from 'some-other-package';
				<Button />
			`,
		},
		// Aliased import with correct prop
		{
			code: `
				import { Button as WPButton } from '@wordpress/components';
				<WPButton __next40pxDefaultSize />
			`,
		},
		// FormFileUpload with render prop (special case)
		{
			code: `
				import { FormFileUpload } from '@wordpress/components';
				<FormFileUpload render={({ open }) => <button onClick={open}>Upload</button>} />
			`,
		},
		// FormFileUpload with __next40pxDefaultSize
		{
			code: `
				import { FormFileUpload } from '@wordpress/components';
				<FormFileUpload __next40pxDefaultSize />
			`,
		},
		// Component with dynamic size prop (assumes it could be non-default)
		{
			code: `
				import { Button } from '@wordpress/components';
				<Button size={buttonSize} />
			`,
		},
		// Non-targeted component (should not be checked)
		{
			code: `
				import { Modal } from '@wordpress/components';
				<Modal />
			`,
		},
		// All targeted components with __next40pxDefaultSize
		{
			code: `
				import {
					BorderBoxControl,
					BorderControl,
					BoxControl,
					ComboboxControl,
					CustomSelectControl,
					FontAppearanceControl,
					FontFamilyControl,
					FontSizePicker,
					FormTokenField,
					InputControl,
					LetterSpacingControl,
					LineHeightControl,
					NumberControl,
					RangeControl,
					SelectControl,
					TextControl,
					ToggleGroupControl,
					UnitControl,
				} from '@wordpress/components';
				<>
					<BorderBoxControl __next40pxDefaultSize />
					<BorderControl __next40pxDefaultSize />
					<BoxControl __next40pxDefaultSize />
					<ComboboxControl __next40pxDefaultSize />
					<CustomSelectControl __next40pxDefaultSize />
					<FontAppearanceControl __next40pxDefaultSize />
					<FontFamilyControl __next40pxDefaultSize />
					<FontSizePicker __next40pxDefaultSize />
					<FormTokenField __next40pxDefaultSize />
					<InputControl __next40pxDefaultSize />
					<LetterSpacingControl __next40pxDefaultSize />
					<LineHeightControl __next40pxDefaultSize />
					<NumberControl __next40pxDefaultSize />
					<RangeControl __next40pxDefaultSize />
					<SelectControl __next40pxDefaultSize />
					<TextControl __next40pxDefaultSize />
					<ToggleGroupControl __next40pxDefaultSize />
					<UnitControl __next40pxDefaultSize />
				</>
			`,
		},
	],
	invalid: [
		// Button without __next40pxDefaultSize
		{
			code: `
				import { Button } from '@wordpress/components';
				<Button />
			`,
			errors: [
				{
					messageId: 'missingProp',
					data: { component: 'Button' },
				},
			],
		},
		// InputControl without __next40pxDefaultSize
		{
			code: `
				import { InputControl } from '@wordpress/components';
				<InputControl value={value} onChange={onChange} />
			`,
			errors: [
				{
					messageId: 'missingProp',
					data: { component: 'InputControl' },
				},
			],
		},
		// Component with __next40pxDefaultSize={false}
		{
			code: `
				import { SelectControl } from '@wordpress/components';
				<SelectControl __next40pxDefaultSize={false} />
			`,
			errors: [
				{
					messageId: 'missingProp',
					data: { component: 'SelectControl' },
				},
			],
		},
		// Component with size="default" (should still require __next40pxDefaultSize)
		{
			code: `
				import { Button } from '@wordpress/components';
				<Button size="default" />
			`,
			errors: [
				{
					messageId: 'missingProp',
					data: { component: 'Button' },
				},
			],
		},
		// Aliased import without __next40pxDefaultSize
		{
			code: `
				import { TextControl as MyTextControl } from '@wordpress/components';
				<MyTextControl />
			`,
			errors: [
				{
					messageId: 'missingProp',
					data: { component: 'TextControl' },
				},
			],
		},
		// FormFileUpload without __next40pxDefaultSize or render
		{
			code: `
				import { FormFileUpload } from '@wordpress/components';
				<FormFileUpload onChange={handleChange} />
			`,
			errors: [
				{
					messageId: 'missingPropFormFileUpload',
				},
			],
		},
		// Multiple components, some invalid
		{
			code: `
				import { Button, InputControl } from '@wordpress/components';
				<>
					<Button __next40pxDefaultSize />
					<InputControl />
				</>
			`,
			errors: [
				{
					messageId: 'missingProp',
					data: { component: 'InputControl' },
				},
			],
		},
		// Multiple invalid components
		{
			code: `
				import { Button, SelectControl } from '@wordpress/components';
				<>
					<Button />
					<SelectControl />
				</>
			`,
			errors: [
				{
					messageId: 'missingProp',
					data: { component: 'Button' },
				},
				{
					messageId: 'missingProp',
					data: { component: 'SelectControl' },
				},
			],
		},
		// Relative import with checkLocalImports enabled
		{
			code: `
				import { Button } from '../button';
				<Button />
			`,
			options: [ { checkLocalImports: true } ],
			errors: [
				{
					messageId: 'missingProp',
					data: { component: 'Button' },
				},
			],
		},
		// Default import from input-control path with checkLocalImports enabled
		{
			code: `
				import InputControl from '../input-control';
				<InputControl />
			`,
			options: [ { checkLocalImports: true } ],
			errors: [
				{
					messageId: 'missingProp',
					data: { component: 'InputControl' },
				},
			],
		},
	],
} );

// Additional tests for checkLocalImports option
ruleTester.run(
	'components-no-missing-40px-size-prop (checkLocalImports)',
	rule,
	{
		valid: [
			// Relative import with correct props
			{
				code: `
				import { Button } from '../button';
				<Button __next40pxDefaultSize />
			`,
				options: [ { checkLocalImports: true } ],
			},
			// Default import with correct props
			{
				code: `
				import InputControl from './input-control';
				<InputControl __next40pxDefaultSize />
			`,
				options: [ { checkLocalImports: true } ],
			},
			// Relative import with non-default size
			{
				code: `
				import { Button } from '../button';
				<Button size="small" />
			`,
				options: [ { checkLocalImports: true } ],
			},
			// Relative import without checkLocalImports (should not be checked)
			{
				code: `
				import { Button } from '../button';
				<Button />
			`,
			},
			// Default import without checkLocalImports (should not be checked)
			{
				code: `
				import InputControl from '../input-control';
				<InputControl />
			`,
			},
			// FormFileUpload relative import with render prop
			{
				code: `
				import { FormFileUpload } from '../form-file-upload';
				<FormFileUpload render={({ open }) => <button onClick={open}>Upload</button>} />
			`,
				options: [ { checkLocalImports: true } ],
			},
		],
		invalid: [],
	}
);
