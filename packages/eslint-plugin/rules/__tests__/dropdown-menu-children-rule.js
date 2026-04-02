/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
const rule = require( '../dropdown-menu-children-rule' );

const ruleTester = new RuleTester( {
	parser: require.resolve( '@babel/eslint-parser' ),
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
		requireConfigFile: false,
	},
} );

ruleTester.run( 'dropdown-menu-child', rule, {
	valid: [
		`<DropdownMenu><MenuItem /></DropdownMenu>`,
		`<DropdownMenu><MenuItemsChoice /></DropdownMenu>`,
		`<DropdownMenu><MenuGroup /></DropdownMenu>`,
	],

	invalid: [
		{
			code: `<DropdownMenu><p>Some description text</p></DropdownMenu>`,
			errors: [
				{
					message:
						'Only `MenuItem`, `MenuItemsChoice`, or `MenuGroup` are allowed as children of the `<DropdownMenu>` component.',
				},
			],
		},
		{
			code: `<DropdownMenu><div>Other content</div></DropdownMenu>`,
			errors: [
				{
					message:
						'Only `MenuItem`, `MenuItemsChoice`, or `MenuGroup` are allowed as children of the `<DropdownMenu>` component.',
				},
			],
		},
		{
			code: `<DropdownMenu><MenuItem /><p>Some extraneous content</p></DropdownMenu>`,
			errors: [
				{
					message:
						'Only `MenuItem`, `MenuItemsChoice`, or `MenuGroup` are allowed as children of the `<DropdownMenu>` component.',
				},
			],
		},
	],
} );
