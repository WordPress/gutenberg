/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../a11y-interpolated-anchor';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 6,
		ecmaFeatures: {
			jsx: true,
		},
	},
} );

ruleTester.run( 'a11y-interpolated-anchor', rule, {
	valid: [
		{
			// Interpolated anchor with href and content in/out of the anchor
			code: `
			( ) => {
				( <div>
					   { createInterpolateElement( __( 'help me <a> test with multiple words </a>.' ), {
							   a: <a href="https://example.com" />,
					   } ) }
				   </div>
			   )
		   };`,
		},
		{
			// Interpolated anchor with href and target
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
			// ⚠️ this is INVALID code, but out of scope for a11y-interpolated-anchor so it should pass here (it gets caught by jsx-a11y/anchor-is-valid instead)
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
			// ⚠️ this is INVALID code, but to really catch this usecase we'd need a lint rule about createInterpolate + <a> tags that's out of scope right now
			code: `
			const a = ( ) => {
				( <div>
					{ createInterpolateElement( __( 'help me <a>Err</a>.' ), {} ) }
				   </div>
			   )
		   };`,
			errors: [
				{
					//we are in the interpolate wrapper
					messageId: 'anchorHasHrefInterpolated',
				},
			],
		},
	],
	invalid: [
		{
			code: `
			<a ></a>`,
			errors: [
				{
					// we are in the eslint/a11y plugin rule, and there is no messageId there
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
					// we are in the eslint/a11y plugin rule, and there is no messageId there
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
					//we are in the interpolate wrapper
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
					//we are in the interpolate wrapper
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
					//we are in the interpolate wrapper
					messageId: 'invalidMarkup',
				},
			],
		},
	],
} );
