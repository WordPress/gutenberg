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

ruleTester.run( '@wordpress/jsx-a11y-anchor-has-content', rule, {
	valid: [
		{
			name: `Valid anchor with text content`,
			code: `
			() => {
				( <div>
					   { createInterpolateElement( __( 'This is a <a> link </a>.' ), {
							   a: <a href="https://wordpress.org" />,
					   } ) }
				   </div>
			   )
		   };`,
			options: [ { components: [ 'MyAnchor' ] } ],
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
			name: `3 custom components through createInterpolateElement, all with valid anchors`,
			code: `
			import {
				createInterpolateElement,
			} from '@wordpress/element';
			import { __ } from '@wordpress/i18n';
			const withTranslate = ( ) => {
				return (
					<div>
						{ createInterpolateElement( __( 'I am a <a>good anchor</a>.' ), {
							a: <a href="example.com"/>,
						} ) }
					</div>
				)
			}
			const usesWithTranslate = ( ) => {
				return (
					<div>
						{ createInterpolateElement( __( 'A <a>good anchor</a>. <withTranslate/>' ), {
							a: <a href="example.com"/>,
							withTranslate: <withTranslate />
						} ) }
					</div>
				)
			};

			const withoutTranslateTwoLevels = ( ) => {
				return (
					<div>
						{ createInterpolateElement(
								'I have <usesWithTranslate />. And <a>Non empty anchor</a>', {
								usesWithTranslate: <usesWithTranslate />,
								a: <a href="hello.com"/>,
							} )
						}
					</div>
				)
			};

			export default function hello( {
			} ) {
				return (
					<withoutTranslateTwoLevels></withoutTranslateTwoLevels>
				);
			}
			`,
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

			options: [ { components: [ 'MyAnchor' ] } ],
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
		{
			name: `3 custom components through createInterpolateElement, 2 have invalid anchors`,
			code: `
			import {
				createInterpolateElement,
			} from '@wordpress/element';
			import { __ } from '@wordpress/i18n';
			const failWithTranslate = ( ) => {
				return (
					<div>
						{ createInterpolateElement( __( 'My content is empty <a></a>.' ), {
							a: <a href="hello.com"/>,
						} ) }
					</div>
				)
			}
			const okUsesWithTranslate = ( ) => {
				return (
					<div>
						{ createInterpolateElement( __( 'This one anchor <a> has content</a>. <failWithTranslate/>' ), {
							a: <a href="hello.com"/>,
							failWithTranslate: <failWithTranslate />
						} ) }
					</div>
				)
			};

			const failWithoutTranslateTwoLevels = ( ) => {
				return (
					<div>
						{ createInterpolateElement(
								'This one with <okUsesWithTranslate /> has an empty anchor <a></a>', {
								okUsesWithTranslate: <okUsesWithTranslate />,
								a: <a href="hello.com"/>,
							} )
						}
					</div>
				)
			};

			export default function hello( {
			} ) {
				return (
					<failWithoutTranslateTwoLevels></failWithoutTranslateTwoLevels>
				);
			}
			`,
			errors: [
				{
					messageId: 'anchorHasContent',
					data: { nodeType: 'CallExpression' },
				},
				{
					messageId: 'anchorHasContent',
					data: { nodeType: 'Literal' },
				},
			],
		},

		{
			name: `Empty anchor through custom component MyAnchor used in createInterpolateElement`,
			code: `
			//MyAnchor.js
			import MyAnchor from './MyAnchor';
			//some other file
			export default function hello( {
			} ) {
				return (
					<div>
					{
						createInterpolateElement(
							'<MyAnchor></MyAnchor>',
							{
								MyAnchor: (
									<MyAnchor href="https://gravatar.com/" />
								),
							}
						)
					}
					</div>
				);
			}`,
			errors: [
				{
					messageId: 'anchorHasContent',
				},
			],
			options: [ { components: [ 'MyAnchor' ] } ],
		},
		{
			name: `Empty anchor through custom component configured in rules (MyAnchor) should fail`,
			code: `
			import MyAnchor from './MyAnchor';
			//some other file

			export default function hello( {
			} ) {
				return (
					<MyAnchor></MyAnchor>
				);
			}`,
			errors: [
				{
					message:
						'Anchors must have content and the content must be accessible by a screen reader.',
				},
			],
			options: [ { components: [ 'MyAnchor' ] } ],
		},
	],
} );
