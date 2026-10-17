import { describe, it } from 'vitest';
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule from '../no-unguarded-get-range-at';

const RuleTester = configureRuleTester( { describe, it } );

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'no-unguarded-get-range-at', rule, {
	valid: [
		{
			code: `const selection = defaultView.getSelection(); const range = selection.rangeCount ? selection.getRangeAt( 0 ) : null;`,
		},
	],
	invalid: [
		{
			code: `defaultView.getSelection().getRangeAt( 0 );`,
			errors: [ { message: 'Avoid unguarded getRangeAt' } ],
		},
	],
} );
