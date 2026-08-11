import { RuleTester } from 'eslint';
import rule from '../no-unsafe-render-order';

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

ruleTester.run( 'no-unsafe-render-order', rule, {
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
				import { Link } from '@wordpress/ui';
				import { VisuallyHidden } from 'some-other-package';

				<Link href="#" render={ <VisuallyHidden /> }>
					Read more
				</Link>;
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
			errors: [ { messageId: 'visuallyHiddenOrder' } ],
		},
		{
			code: `
				import { Dialog as UIDialog, VisuallyHidden as Hidden } from '@wordpress/ui';

				<UIDialog.Title render={ <Hidden /> }>
					Title
				</UIDialog.Title>;
			`,
			errors: [ { messageId: 'visuallyHiddenOrder' } ],
		},
		{
			code: `
				import { VisuallyHidden } from '@wordpress/ui';

				<CustomThing render={ <VisuallyHidden /> }>
					Hidden content
				</CustomThing>;
			`,
			errors: [ { messageId: 'visuallyHiddenOrder' } ],
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
				import * as Field from '../index';
				import { VisuallyHidden } from '../../../visually-hidden';

				<Field.Label render={ <VisuallyHidden /> }>Name</Field.Label>;
			`,
			options: [ { checkLocalImports: true } ],
			errors: [ { messageId: 'visuallyHiddenOrder' } ],
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
