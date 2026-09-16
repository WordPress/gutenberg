import { describe, it } from 'vitest';
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule from '../no-storybook-build-style-imports';

const RuleTester = configureRuleTester( { describe, it } );

const ruleTester = new RuleTester( {
	languageOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
	},
} );

ruleTester.run( 'no-storybook-build-style-imports', rule, {
	valid: [
		{ code: "import './style.css';" },
		{ code: "import './style.scss';" },
		{ code: "import styles from './style.module.css';" },
		{ code: "import theme from './style.module.css?inline';" },
		{ code: "import './component';" },
		{
			code: "import sheet from '@wordpress/block-library/build-style/style.css?raw';",
		},
		{
			code: "import sheet from '@wordpress/block-editor/build-style/content.css?raw';",
		},
		{
			code: "import sheet from '@wordpress/components/build-style/style.css?inline';",
		},
		{
			code: "import '@wordpress/components/build-style/style.css?inline';",
		},
		{ code: "import local from './style.lazy.scss?inline';" },
		{
			code: "import( '@wordpress/components/build-style/style.css?inline' );",
		},
		{ code: 'import( href );' },
		{
			code: 'import( `@wordpress/dataviews/build-style/${ name }.css` );',
		},
	],
	invalid: [
		{
			code: "import '@wordpress/dataviews/build-style/style.css';",
			errors: [ { messageId: 'usePackageStylesMatcher' } ],
		},
		{
			code: "import '@wordpress/commands/build-style/style.css';",
			errors: [ { messageId: 'usePackageStylesMatcher' } ],
		},
		{
			code: "import '@wordpress/components/build-style/style.css';",
			errors: [ { messageId: 'usePackageStylesMatcher' } ],
		},
		{
			code: "import '@wordpress/dataviews/build-style/style.scss';",
			errors: [ { messageId: 'usePackageStylesMatcher' } ],
		},
		{
			code: "import styles from '@wordpress/dataviews/build-style/style.css';",
			errors: [ { messageId: 'usePackageStylesMatcher' } ],
		},
		{
			code: "import '@wordpress/components/build-style/style-rtl.css';",
			errors: [ { messageId: 'usePackageStylesMatcher' } ],
		},
		{
			code: "import '../../../dataviews/build-style/style.css';",
			errors: [ { messageId: 'usePackageStylesMatcher' } ],
		},
		{
			code: "import( '@wordpress/dataviews/build-style/style.css' );",
			errors: [ { messageId: 'usePackageStylesMatcher' } ],
		},
		{
			code: 'import( `@wordpress/dataviews/build-style/style.css` );',
			errors: [ { messageId: 'usePackageStylesMatcher' } ],
		},
		{
			code: "import '..\\\\..\\\\dataviews\\\\build-style\\\\style.css';",
			errors: [ { messageId: 'usePackageStylesMatcher' } ],
		},
	],
} );
