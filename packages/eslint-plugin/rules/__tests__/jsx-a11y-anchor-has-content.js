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
			code: `createInterpolateElement( __( 'This is a <a>link</a>.' ), {
					   a: <a href="https://wordpress.org" />,
					} );`,
			options: [ { components: [ 'MyAnchor' ] } ],
		},
		{
			name: `Valid anchor with text content with trailing spaces, and an extra attribute`,
			code: `createInterpolateElement( __( 'help me <a> test with multiple words</a>.' ), {
						a: <a href="https://example.com" target="_blank" />,
					} );`,
		},
		{
			name: `Valid anchor with a custom component as content.`,
			code: `createInterpolateElement( __( 'help me <a><TextWrapper /></a>.' ), {
						a: <a href="https://example.com" target="_blank" />,
					} );`,
		},
		{
			name: `Presumably valid anchor with a call to another function in the translation text (we bail).`,
			code: `createInterpolateElement( __( callMe() ), {
						a: <a href="https://example.com" target="_blank" />,
					} );`,
		},
		{
			name: `Valid anchor without using createInterpolateElement`,
			code: `() => <a href="https://example.com">test with multiple words</a>;`,
		},
		{
			name: `Invalid code, but out of scope for this rule (caught by jsx-a11y/anchor-has-content)`,
			code: `createInterpolateElement( __( 'help me <a>Err</a>.' ), {
						a: <a target="_blank"/>,
					} );`,
		},
		{
			name: `Invalid usage of createInterpolateElement, ignored by the this rule`,
			code: `createInterpolateElement( __( 'help me <a>Err</a>.' ), {} )`,
		},
		{
			name: `3 custom components through createInterpolateElement, all with valid anchors`,
			code: `
			import {
				createInterpolateElement,
			} from '@wordpress/element';
			import { __ } from '@wordpress/i18n';
			const WithTranslate = () => {
				return (
					<div>
						{ createInterpolateElement( __( 'I am a <a>good anchor</a>.' ), {
							a: <a href="example.com" />,
						} ) }
					</div>
				);
			};
			const UsesWithTranslate = () => {
				return (
					<div>
						{ createInterpolateElement(
							__( 'A <a>good anchor</a>. <WithTranslate/>' ),
							{
								a: <a href="example.com" />,
								WithTranslate: <WithTranslate />,
							}
						) }
					</div>
				);
			};
			const WithoutTranslateTwoLevels = () => {
				return (
					<div>
						{ createInterpolateElement(
							'I have <UsesWithTranslate />. And <a>Non empty anchor</a>',
							{
								UsesWithTranslate: <UsesWithTranslate />,
								a: <a href="hello.com" />,
							}
						) }
					</div>
				);
			};
			export default function hello( {} ) {
				return <WithoutTranslateTwoLevels></WithoutTranslateTwoLevels>;
			};
			`,
		},
	],
	invalid: [
		{
			name: `Empty anchor without using createInterpolateElement (error comes from eslint-plugin-jsx-a11y/anchor-has-content)`,
			code: `() => <a></a>`,
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
			code: `() => <div><a></a>some text outside the anchor</div>;`,
			errors: [
				{
					message:
						'Anchors must have content and the content must be accessible by a screen reader.',
				},
			],
		},
		{
			name: `Empty anchor content (@wordpress/jsx-a11y-anchor-has-content)`,
			code: `createInterpolateElement( __( 'help me <a></a>.' ), {
					a: <a href="https://example.com" />,
					} );`,
			errors: [
				{
					messageId: 'anchorIsEmpty',
				},
			],
		},
		{
			name: `Invalid anchor markup, with empty content (@wordpress/jsx-a11y-anchor-has-content)`,
			code: `createInterpolateElement( __( 'help me <a>.' ), {
						a: <a href="https://example.com" />,
					} );`,
			errors: [
				{
					messageId: 'invalidMarkup',
				},
			],
		},
		{
			name: `Invalid anchor markup, with content (@wordpress/jsx-a11y-anchor-has-content)`,
			code: `createInterpolateElement( __( 'help me </a>ErrInvalidMarkup<a>.' ), {
						a: <a href="https://example.com" />,
					} );`,
			errors: [
				{
					messageId: 'invalidMarkup',
				},
			],
		},
		{
			name: `Anchor with a call to another function within a TemplateLiteral (we do not bail).`,
			code: `createInterpolateElement( __( \`hello \${ hello }\` ), {
						a: <a href="https://example.com" target="_blank" />,
					} );`,
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
			const FailWithTranslate = () => {
				return (
					<div>
						{ createInterpolateElement( __( 'My content is empty <a></a>.' ), {
							a: <a href="hello.com" />,
						} ) }
					</div>
				);
			};
			const OkUsesWithTranslate = () => {
				return (
					<div>
						{ createInterpolateElement(
							__(
								'This one anchor <a>has content</a>. <FailWithTranslate/>'
							),
							{
								a: <a href="hello.com" />,
								FailWithTranslate: <FailWithTranslate />,
							}
						) }
					</div>
				);
			};
			const FailWithoutTranslateTwoLevels = () => {
				return (
					<div>
						{ createInterpolateElement(
							'This one with <OkUsesWithTranslate /> has an empty anchor <a></a>',
							{
								OkUsesWithTranslate: <OkUsesWithTranslate />,
								a: <a href="hello.com" />,
							}
						) }
					</div>
				);
			};

			export default function hello( {} ) {
				return <FailWithoutTranslateTwoLevels></FailWithoutTranslateTwoLevels>;
			};
			`,
			errors: [
				{
					messageId: 'anchorIsEmpty',
					data: { nodeType: 'CallExpression' },
				},
				{
					messageId: 'anchorIsEmpty',
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
			export function hello( {} ) {
				return (
					<div>
						{ createInterpolateElement( '<MyAnchor></MyAnchor>', {
							MyAnchor: <MyAnchor href="https://gravatar.com/" />,
						} ) }
					</div>
				);
			};`,
			errors: [
				{
					messageId: 'anchorIsEmpty',
				},
			],
			options: [ { components: [ 'MyAnchor' ] } ],
		},
		{
			name: `Empty anchor through custom component configured in rules (MyAnchor) should fail`,
			code: `
			import MyAnchor from './MyAnchor';
			//some other file

			export default function hello( {} ) {
				return (
					<MyAnchor></MyAnchor>
				);
			};`,
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
