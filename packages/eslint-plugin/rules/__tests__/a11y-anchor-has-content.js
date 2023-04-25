/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../a11y-anchor-has-content';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
		ecmaFeatures: {
			jsx: true,
		},
	},
} );

ruleTester.run( 'a11y-anchor-has-content', rule, {
	valid: [
		{
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
		// Anchor with a custom component as content. It may or may not be valid. No errors are triggered.
		{
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
			// Anchor without createInterpolateElement
			code: `
			( ) => {
				( <div>
					   <a href="https://example.com"> test with multiple words </a>.
				   </div>
			   )
		   };`,
		},
		{
			// ⚠️ This is invalid code that would get flagged by jsx-a11y/anchor-is-valid, but NOT by eslint-plugin-jsx-a11y/anchor-has-content or @wordpress/a11-anchor-has-content.
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
			// ⚠️ This passes the linter, but it's actually invalid code that would fail in runtime with createInterpolateElement due to missing the conversion map.
			code: `
			const a = ( ) => {
				( <div>
					{ createInterpolateElement( __( 'help me <a>Err</a>.' ), {} ) }
				   </div>
			   )
		   };`,
		},
	],
	invalid: [
		{
			code: `
			<a ></a>`,
			errors: [
				{
					// Linter failure and message by eslint-plugin-jsx-a11y/anchor-has-content.
					message:
						'Anchors must have content and the content must be accessible by a screen reader.',
				},
			],
		},
		{
			code: `
			const a = ( ) => {
				( <div>
					   <a></a>.
				   </div>
			   )
		   };`,
			errors: [
				{
					// Linter failure and message by eslint-plugin-jsx-a11y/anchor-has-content.
					message:
						'Anchors must have content and the content must be accessible by a screen reader.',
				},
			],
		},
		{
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
					// Linter failure and messageId set by @wordpress/a11y-anchor-has-content.
					messageId: 'anchorHasContent',
				},
			],
		},
		{
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
					// Linter failure and messageId set by @wordpress/a11y-anchor-has-content.
					messageId: 'invalidMarkup',
				},
			],
		},
		{
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
					// Linter failure and messageId set by @wordpress/a11y-anchor-has-content.
					messageId: 'invalidMarkup',
				},
			],
		},
	],
} );
