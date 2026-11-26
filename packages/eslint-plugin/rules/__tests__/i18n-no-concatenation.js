import { describe, it } from 'vitest';
import configureRuleTester from '../../test-utils/configure-rule-tester';
import rule from '../i18n-no-concatenation';

const RuleTester = configureRuleTester( { describe, it } );

const ruleTester = new RuleTester( {
	languageOptions: {
		ecmaVersion: 2020,
		parserOptions: {
			ecmaFeatures: {
				jsx: true,
			},
		},
	},
} );

ruleTester.run( 'i18n-no-concatenation', rule, {
	valid: [
		{
			code: `sprintf( __( 'Hello %s' ), name )`,
		},
		{
			code: `__( 'Hello ' + 'world' )`,
		},
		{
			code: `__( 'Hello' ) + ' '`,
		},
		{
			code: `'prefix-' + name`,
		},
		{
			code: '`${ __( "Hello" ) }`',
		},
		{
			code: 'css`color: ${ __( "red" ) }`',
		},
		{
			code: `<p>{ __( 'Hello world' ) }</p>`,
		},
		{
			code: `<p>
				{ __( 'Hello world' ) }
			</p>`,
		},
		{
			code: `<Button>{ icon }{ __( 'Save' ) }</Button>`,
		},
		{
			code: `<label>{ __( 'Name' ) } <span className="required" /></label>`,
		},
		{
			code: `<div>{ __( 'Title' ) }<p>{ __( 'Description' ) }</p></div>`,
		},
		{
			code: `'<strong>' + __( 'Hello' ) + '</strong>'`,
		},
		{
			code: '`<p>${ __( "Hello" ) }</p>`',
		},
		{
			code: `<p>{ __( 'First line' ) }<br />{ __( 'Second line' ) }</p>`,
		},
		{
			code: `<p>{ __( 'New to blocks?' ) } <ExternalLink href={ url }>{ __( 'Learn more' ) }</ExternalLink></p>`,
		},
		{
			code: `<p>{ _n( 'One block selected.', '%d blocks selected.', count ) } <a href={ url }>{ __( 'Clear' ) }</a></p>`,
		},
		{
			code: `<p>{ createInterpolateElement( __( 'Read <a>more</a>' ), { a: <a href={ url } /> } ) }</p>`,
		},
	],
	invalid: [
		{
			code: `__( 'Hello' ) + ' ' + __( 'world' )`,
			errors: [ { messageId: 'concatenated' } ],
		},
		{
			code: `__( 'Hello' ) + name`,
			errors: [ { messageId: 'concatenated' } ],
		},
		{
			code: `count + ' ' + _n( 'item', 'items', count )`,
			errors: [ { messageId: 'concatenated' } ],
		},
		{
			code: `sprintf( __( 'Hello %s' ), name ) + '!'`,
			errors: [ { messageId: 'concatenated' } ],
		},
		{
			code: '`${ __( "Hello" ) } ${ name }`',
			errors: [ { messageId: 'concatenated' } ],
		},
		{
			code: '`${ __( "Total" ) }: 5`',
			errors: [ { messageId: 'concatenated' } ],
		},
		{
			code: `<p>{ __( 'Read' ) } <a href={ url }>{ __( 'more' ) }</a></p>`,
			errors: [ { messageId: 'concatenated' } ],
		},
		{
			code: `<p>{ __( 'Learn about' ) } <ExternalLink href={ url }>{ __( 'blocks' ) }</ExternalLink></p>`,
			errors: [ { messageId: 'concatenated' } ],
		},
		{
			code: `<p>{ __( 'Name' ) }: { name }</p>`,
			errors: [ { messageId: 'concatenated' } ],
		},
		{
			code: `<p>{ __( 'Get started here' ) }.</p>`,
			errors: [ { messageId: 'concatenated' } ],
		},
		{
			code: `<a href="#top">« { __( 'Older Comments' ) }</a>`,
			errors: [ { messageId: 'concatenated' } ],
		},
		{
			code: `<p>{ __( 'Hello.' ) }<br />{ __( 'Read' ) } <a href={ url }>{ __( 'more' ) }</a></p>`,
			errors: [ { messageId: 'concatenated' } ],
		},
		{
			code: `<>{ __( 'Hello' ) } { __( 'world' ) }</>`,
			errors: [ { messageId: 'concatenated' } ],
		},
	],
} );
