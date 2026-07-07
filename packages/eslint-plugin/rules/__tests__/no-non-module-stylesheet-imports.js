import { RuleTester } from 'eslint';
import rule from '../no-non-module-stylesheet-imports';

const ruleTester = new RuleTester( {
	languageOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'no-non-module-stylesheet-imports', rule, {
	valid: [
		{ code: "import './component';" },
		{ code: "import styles from './style.module.css';" },
		{ code: "import styles from './style.module.scss';" },
		{ code: "import styles from './style.module.sass';" },
		{ code: "import theme from './style.module.css?inline';" },
		{ code: "import './style.module.css';" },
		{ code: "import './style.module.scss?inline';" },
	],
	invalid: [
		{
			code: "import './style.css';",
			errors: [ { messageId: 'noNonModuleStylesheet' } ],
		},
		{
			code: "import './style.scss';",
			errors: [ { messageId: 'noNonModuleStylesheet' } ],
		},
		{
			code: "import './style.sass';",
			errors: [ { messageId: 'noNonModuleStylesheet' } ],
		},
		{
			code: "import styles from './style.scss';",
			errors: [ { messageId: 'noNonModuleStylesheet' } ],
		},
	],
} );
