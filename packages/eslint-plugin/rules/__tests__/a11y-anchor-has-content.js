/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../jsx-a11y-anchor-has-content';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
		ecmaFeatures: {
			jsx: true,
		},
	},
} );

ruleTester.run( 'jsx-a11y-anchor-has-content', rule, {
	valid: [
		{
			name: `Valid anchor with text content`,
			code: `
			( ) => {
				( <div>
					   { createInterpolateElement( __( 'This is a <a> link </a>.' ), {
							   a: <a href="https://wordpress.org" />,
					   } ) }
				   </div>
			   )
		   };`,
		},
		{
			name: `Valid anchor with text content and an extra attribute`,
			code: `
			( ) => {
				( <div>
					   { createInterpolateElement( __( 'help me <a> test with multiple words </a>.' ), {
							   a: <a href="https://example.com" target="_blank" />,
					   } ) }
				   </div>
			   )
		   };`,
		},
		{
			name: `Valid anchor with a custom component as content.`,
			code: `
			( ) => {
				( <div>
					   { createInterpolateElement( __( 'help me <a> <TextWrapper /> </a>.' ), {
							   a: <a href="https://example.com" target="_blank" />,
					   } ) }
				   </div>
			   )
		   };`,
		},
		{
			name: `Valid anchor without using createInterpolateElement`,
			code: `
			( ) => {
				( <div>
					   <a href="https://example.com"> test with multiple words </a>.
				   </div>
			   )
		   };`,
		},
		{
			name: `Invalid code, but out of scope for this rule (caught by jsx-a11y/anchor-has-content)`,
			code: `
			const a = ( ) => {
				( <div>
					{ createInterpolateElement( __( 'help me <a>Err</a>.' ), {
						a: <a target="_blank"/>,
				} ) }
				   </div>
			   )
		   };`,
		},
		{
			name: `Invalid usage of createInterpolateElement, ignored by the this rule`,
			code: `
			const a = ( ) => {
				( <div>
					{ createInterpolateElement( __( 'help me <a>Err</a>.' ), {} ) }
				   </div>
			   )
		   };`,
		},
		{
			name: `Boro is a genius (the good kind, not evil)`,
			code: `
			const foo = ( ) => {
				<div>
				{ createInterpolateElement( __( 'help me <a>Err</a>.' ), {} ) }
			   </div>
			};
			const a = ( ) => {
				(
					<div>
						createInterpolateElement( __( 'help me <foo>.' ), {
							foo: <foo />,
						} )
				   </div>
			   )
		   };`,
		},
	],
	invalid: [
		{
			name: `Empty anchor without using createInterpolateElement (error comes from eslint-plugin-jsx-a11y/anchor-has-content)`,
			code: `
			<a></a>`,
			errors: [
				{
					message:
						'Anchors must have content and the content must be accessible by a screen reader.',
				},
			],
		},
		{
			name: `Empty anchor wrapped in another element (error comes from eslint-plugin-jsx-a11y/anchor-has-content)`,
			code: `
			const a = ( ) => {
				( <div>
					   <a></a>.
				   </div>
			   )
		   };`,
			errors: [
				{
					message:
						'Anchors must have content and the content must be accessible by a screen reader.',
				},
			],
		},
		{
			name: `Empty anchor content (@wordpress/jsx-a11y-anchor-has-content)`,
			code: `
			const a = ( ) => {
				( <div>
					{ createInterpolateElement( __( 'help me <a></a>.' ), {
						a: <a href="https://example.com" />,
				} ) }
				   </div>
			   )
		   };`,
			errors: [
				{
					messageId: 'anchorHasContent',
				},
			],
		},
		{
			name: `Invalid anchor markup, with empty content (@wordpress/jsx-a11y-anchor-has-content)`,
			code: `
			const a = ( ) => {
				( <div>
					{ createInterpolateElement( __( 'help me <a>.' ), {
						a: <a href="https://example.com" />,
				} ) }
				   </div>
			   )
		   };`,
			errors: [
				{
					messageId: 'invalidMarkup',
				},
			],
		},
		{
			name: `Invalid anchor markup, with content (@wordpress/jsx-a11y-anchor-has-content)`,
			code: `
			const a = ( ) => {
				( <div>
					{ createInterpolateElement( __( 'help me </a>ErrInvalidMarkup<a>.' ), {
						a: <a href="https://example.com" />,
				} ) }
				   </div>
			   )
		   };`,
			errors: [
				{
					messageId: 'invalidMarkup',
				},
			],
		},
	],
} );
