import { describe, it } from 'vitest';
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule from '../i18n-no-html-wrapped-strings';

const RuleTester = configureRuleTester( { describe, it } );

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'i18n-no-html-wrapped-strings', rule, {
	valid: [
		{
			code: `__( 'Hello world' )`,
		},
		{
			code: `__( 'Hello <strong>world</strong>' )`,
		},
		{
			code: `__( '<strong>Note:</strong> This cannot be undone.' )`,
		},
		{
			code: `__( '<em>One</em> and <em>two</em>' )`,
		},
		{
			code: `__( '<p>First</p><p>Second</p>' )`,
		},
		{
			code: `__( '<a href="https://wordpress.org/">WordPress</a>' )`,
		},
		{
			code: `__( '<option value="%s">Option</option>' )`,
		},
		{
			code: `__( '<span class="%1$s">Label</span>' )`,
		},
		{
			code: `__( '<br />Line' )`,
		},
		{
			code: `__( '<BlockCount /> blocks' )`,
		},
		{
			code: `_x( 'Text', '<strong>context</strong>' )`,
		},
		{
			code: `__( value )`,
		},
	],
	invalid: [
		{
			code: `__( '<strong>Warning</strong>' )`,
			errors: [
				{ messageId: 'htmlWrapped', data: { tagName: 'strong' } },
			],
		},
		{
			code: `__( '<p class="notice">Text with <em>emphasis</em>.</p>' )`,
			errors: [ { messageId: 'htmlWrapped', data: { tagName: 'p' } } ],
		},
		{
			code: `__( '<span><span>Nested</span> text</span>' )`,
			errors: [ { messageId: 'htmlWrapped', data: { tagName: 'span' } } ],
		},
		{
			code: `__( '<a>Learn more</a>' )`,
			errors: [ { messageId: 'htmlWrapped', data: { tagName: 'a' } } ],
		},
		{
			code: `__( '<ExternalLink>Learn more</ExternalLink>' )`,
			errors: [
				{
					messageId: 'htmlWrapped',
					data: { tagName: 'ExternalLink' },
				},
			],
		},
		{
			code: `_n( '<b>%d block</b>', '<b>%d blocks</b>', count )`,
			errors: [
				{ messageId: 'htmlWrapped', data: { tagName: 'b' } },
				{ messageId: 'htmlWrapped', data: { tagName: 'b' } },
			],
		},
		{
			code: `i18n._x( '<code>Code</code>', 'context' )`,
			errors: [ { messageId: 'htmlWrapped', data: { tagName: 'code' } } ],
		},
	],
} );
