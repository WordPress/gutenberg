import { describe, it } from 'vitest';
import { RuleTester } from 'eslint';
import rule from '../no-non-module-stylesheet-imports';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const ruleTester = new RuleTester( {
	languageOptions: {
		sourceType: 'module',
		ecmaVersion: 2020,
	},
} );

ruleTester.run( 'no-non-module-stylesheet-imports', rule, {
	valid: [
		{ code: "import styles from './style.module.css';" },
		{ code: "import './style.module.scss';" },
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
		{ code: "import './style.css?raw';" },
		{
			code: "import( '@wordpress/components/build-style/style.css?inline' );",
		},
		{ code: 'import( href );' },
		{
			code: 'import( `@wordpress/dataviews/build-style/${ name }.css` );',
		},
		{
			code: "import sheet from '@wordpress/components/build-style/style.css?url';",
		},
		{
			code: "import( '@wordpress/components/build-style/style.css?url' );",
		},
		{
			code: "export { sheet } from '@wordpress/components/build-style/style.css?url';",
		},
	],
	invalid: [
		{
			code: "import './style.css';",
			errors: [ { messageId: 'useCssModule' } ],
		},
		{
			code: "import './style.scss';",
			errors: [ { messageId: 'useCssModule' } ],
		},
		{
			code: "import styles from './style.scss';",
			errors: [ { messageId: 'useCssModule' } ],
		},
		{
			code: "import '../style.scss';",
			errors: [ { messageId: 'useCssModule' } ],
		},
		{
			code: "import './style.sass';",
			errors: [ { messageId: 'useCssModule' } ],
		},
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
		{
			code: "export * from '@wordpress/dataviews/build-style/style.css';",
			errors: [ { messageId: 'usePackageStylesMatcher' } ],
		},
		{
			code: "export { styles } from '@wordpress/dataviews/build-style/style.css';",
			errors: [ { messageId: 'usePackageStylesMatcher' } ],
		},
	],
} );
