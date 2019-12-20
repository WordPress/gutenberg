/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-base-control-with-label-without-id';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
		ecmaFeatures: {
			jsx: true,
		},
	},
} );

ruleTester.run( 'no-base-control-with-label-without-id', rule, {
	valid: [
		{
			code: `
			<BaseControl
				label="ok"
				id="my-id"
			/>`,
		},
		{
			code: `<BaseControl />`,
		},
		{
			code: `
			<BaseControl
				label="ok"
				id="my-id"
			>
				<input id="my-id" />
			</BaseControl>`,
		},
		{
			code: `
			<BaseControl>
				<input id="my-id" />
			</BaseControl>`,
		},
		{
			code: `
			<BaseControl
				id="my-id"
			>
				<input id="my-id" />
			</BaseControl>`,
		},
	],
	invalid: [
		{
			code: `
			<BaseControl
				label="ok"
			>
				<input id="my-id" />
			</BaseControl>`,
			errors: [ { message: 'When using BaseControl component if a label property is passed an id property should also be passed.' } ],
		},
		{
			code: `
			<BaseControl
				label="ok"
			/>`,
			errors: [ { message: 'When using BaseControl component if a label property is passed an id property should also be passed.' } ],
		},
	],
} );
