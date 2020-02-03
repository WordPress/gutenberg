/**
 * External dependencies
 */
import { RuleTester } from 'eslint';

/**
 * Internal dependencies
 */
import rule from '../react-no-unsafe-timeout';

const ruleTester = new RuleTester( {
	parserOptions: {
		ecmaVersion: 6,
	},
} );

ruleTester.run( 'react-no-unsafe-timeout', rule, {
	valid: [
		{
			code: `function getNotComponent() { setTimeout(); }`,
		},
		{
			code: `function MyComponent( props ) { const { setTimeout } = props; ( () => { setTimeout(); } )(); }`,
		},
		{
			code: `function MyComponent( props ) { props.setTimeout(); }`,
		},
		{
			code: `class MyNotComponent { doAction() { setTimeout(); } }`,
		},
		{
			code: `class MyComponent extends wp.element.Component { componentDidMount() { const { setTimeout } = this.props; setTimeout(); } }`,
		},
		{
			code: `class MyComponent extends Component { componentDidMount() { const { setTimeout } = this.props; setTimeout(); } }`,
		},
		{
			code: `class MyComponent extends Component { componentDidMount() { this.props.setTimeout(); } }`,
		},
		{
			code: `class MyComponent extends Component { componentDidMount() { this.timeoutId = setTimeout(); } }`,
		},
		{
			code: `
function MyComponent() {
	useEffect( () => {
		const timeoutHandle = setTimeout( () => {} );

		return () => clearTimeout( timeoutHandle );
	}, [] );

	return null;
}`,
		},
	],
	invalid: [
		{
			code: `function MyComponent() { setTimeout(); }`,
			errors: [
				{
					message:
						'setTimeout in a component must be cancelled on unmount',
				},
			],
		},
		{
			code: `class MyComponent extends Component { componentDidMount() { setTimeout(); } }`,
			errors: [
				{
					message:
						'setTimeout in a component must be cancelled on unmount',
				},
			],
		},
		{
			code: `class MyComponent extends wp.element.Component { componentDidMount() { setTimeout(); } }`,
			errors: [
				{
					message:
						'setTimeout in a component must be cancelled on unmount',
				},
			],
		},
	],
} );
