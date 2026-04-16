import { RuleTester } from 'eslint';
import rule from '../ui-no-unsafe-render-order';

const ruleTester = new RuleTester( {
	languageOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
		parserOptions: {
			ecmaFeatures: {
				jsx: true,
			},
		},
	},
} );

ruleTester.run( 'ui-no-unsafe-render-order', rule, {
	valid: [
		{
			code: `
				import { Dialog, VisuallyHidden } from '@wordpress/ui';

				<VisuallyHidden render={ <Dialog.Title /> }>
					Title
				</VisuallyHidden>;
			`,
		},
		{
			code: `
				import { Text, Link } from '@wordpress/ui';

				<Text render={ <Link href="#" /> }>Read more</Text>;
			`,
		},
		{
			code: `
				import * as UI from '@wordpress/ui';

				<UI.Text render={ <UI.Link href="#" /> }>Read more</UI.Text>;
			`,
		},
		{
			code: `
				import { Popover } from '@wordpress/ui';
				import { VisuallyHidden } from 'some-other-package';

				<Popover.Title render={ <VisuallyHidden /> }>
					Title
				</Popover.Title>;
			`,
		},
		{
			code: `
				import { Link } from '@wordpress/ui';

				<Link href="#">Read more</Link>;
			`,
		},
		{
			code: `
				import * as Field from '../index';
				import { VisuallyHidden } from '../../../visually-hidden';

				<Field.Label render={ <VisuallyHidden /> }>Name</Field.Label>;
			`,
		},
	],
	invalid: [
		{
			code: `
				import { Dialog, VisuallyHidden } from '@wordpress/ui';

				<Dialog.Title render={ <VisuallyHidden /> }>
					Title
				</Dialog.Title>;
			`,
			errors: [
				{
					messageId: 'visuallyHiddenOrder',
					data: { component: 'Dialog.Title' },
				},
			],
		},
		{
			code: `
				import { Dialog as UIDialog, VisuallyHidden as Hidden } from '@wordpress/ui';

				<UIDialog.Title render={ <Hidden /> }>
					Title
				</UIDialog.Title>;
			`,
			errors: [
				{
					messageId: 'visuallyHiddenOrder',
					data: { component: 'Dialog.Title' },
				},
			],
		},
		{
			code: `
				import * as UI from '@wordpress/ui';

				<UI.Popover.Title render={ <UI.VisuallyHidden /> }>
					Title
				</UI.Popover.Title>;
			`,
			errors: [
				{
					messageId: 'visuallyHiddenOrder',
					data: { component: 'Popover.Title' },
				},
			],
		},
		{
			code: `
				import { Link, Text } from '@wordpress/ui';

				<Link href="#" render={ <Text /> }>
					Read more
				</Link>;
			`,
			errors: [ { messageId: 'linkTextOrder' } ],
		},
		{
			code: `
				import { Link as UILink, Text as UIText } from '@wordpress/ui';

				<UILink href="#" render={ <UIText /> }>
					Read more
				</UILink>;
			`,
			errors: [ { messageId: 'linkTextOrder' } ],
		},
		{
			code: `
				import * as UI from '@wordpress/ui';

				<UI.Link href="#" render={ <UI.Text /> }>
					Read more
				</UI.Link>;
			`,
			errors: [ { messageId: 'linkTextOrder' } ],
		},
		{
			code: `
				import * as Fieldset from '../';
				import { VisuallyHidden } from '../../../visually-hidden';

				<Fieldset.Legend render={ <VisuallyHidden /> }>
					Legend
				</Fieldset.Legend>;
			`,
			options: [ { checkLocalImports: true } ],
			errors: [
				{
					messageId: 'visuallyHiddenOrder',
					data: { component: 'Fieldset.Legend' },
				},
			],
		},
		{
			code: `
				import { Link } from '../index';
				import { Text } from '../../text';

				<Link href="#" render={ <Text /> }>
					Read more
				</Link>;
			`,
			options: [ { checkLocalImports: true } ],
			errors: [ { messageId: 'linkTextOrder' } ],
		},
	],
} );
