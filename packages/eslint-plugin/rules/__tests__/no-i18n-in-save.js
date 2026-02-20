/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../no-i18n-in-save';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
		sourceType: 'module',
		ecmaFeatures: {
			jsx: true,
		},
	},
} );

ruleTester.run( 'no-i18n-in-save', rule, {
	valid: [
		{
			code: `
function edit() {
	return __( 'Hello World' );
}
			`,
		},
		{
			code: `
const edit = () => {
	return __( 'Hello World' );
};
			`,
		},
		{
			code: `
const settings = {
	edit() {
		return __( 'Hello World' );
	},
};
			`,
		},
		{
			code: `
// Translation functions are fine in non-save files
function render() {
	return __( 'Hello World' );
}
			`,
		},
		{
			code: `
// Translation in edit function
export default function Edit() {
	return <div>{ __( 'Hello World' ) }</div>;
}
			`,
		},
		{
			code: `
// Translation in deprecated save function is allowed
function save() {
	return __( 'Hello World' );
}
			`,
			filename: '/path/to/block/deprecated.js',
		},
		{
			code: `
// Translation in deprecated save function with Windows path
function save() {
	return __( 'Hello World' );
}
			`,
			filename: 'D:\\path\\to\\block\\deprecated.js',
		},
	],
	invalid: [
		{
			code: `
// Translation in save file outside save function
function render() {
	return __( 'Hello World' );
}
			`,
			filename: '/path/to/block/save.js',
			errors: [
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
			],
		},
		{
			code: `
function save() {
	return __( 'Hello World' );
}
			`,
			errors: [
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
			],
		},
		{
			code: `
const save = () => {
	return __( 'Hello World' );
};
			`,
			errors: [
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
			],
		},
		{
			code: `
const save = function() {
	return __( 'Hello World' );
};
			`,
			errors: [
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
			],
		},
		{
			code: `
export default function save() {
	return <span>{ __( 'Hello World' ) }</span>;
}
			`,
			errors: [
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
			],
		},
		{
			code: `
const settings = {
	save() {
		return __( 'Hello World' );
	},
};
			`,
			errors: [
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
			],
		},
		{
			code: `
const settings = {
	save: () => __( 'Hello World' ),
};
			`,
			errors: [
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
			],
		},
		{
			code: `
function save() {
	return _x( 'Hello', 'greeting' );
}
			`,
			errors: [
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
			],
		},
		{
			code: `
function save() {
	const count = 5;
	return _n( 'One item', 'Multiple items', count );
}
			`,
			errors: [
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
			],
		},
		{
			code: `
function save() {
	const count = 5;
	return _nx( 'One item', 'Multiple items', count, 'context' );
}
			`,
			errors: [
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
			],
		},
		{
			code: `
function save() {
	return (
		<button>
			<span>{ __( 'Click me' ) }</span>
		</button>
	);
}
			`,
			errors: [
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
			],
		},
		{
			code: `
// Multiple translation calls in save
function save() {
	const label = __( 'Label' );
	return <div title={ _x( 'Title', 'context' ) }>{ label }</div>;
}
			`,
			errors: [
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
			],
		},
		{
			code: `
// Translation after a nested inner function named save must still be caught
function save() {
	function save() {}
	return __( 'Hello World' );
}
			`,
			errors: [
				{
					messageId: 'noI18nInSave',
					type: 'CallExpression',
				},
			],
		},
	],
} );
