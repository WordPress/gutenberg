import { RuleTester } from 'eslint';
import rule from '../no-unmerged-classname';

const ruleTester = new RuleTester( {
	parserOptions: {
		sourceType: 'module',
		ecmaVersion: 2018,
		ecmaFeatures: {
			jsx: true,
		},
	},
} );

ruleTester.run( 'no-unmerged-classname', rule, {
	valid: [
		{
			// className destructured and merged via clsx
			code: `
				function Foo( { className, ...restProps } ) {
					return <div className={ clsx( styles.foo, className ) } { ...restProps } />;
				}
			`,
		},
		{
			// className destructured and used directly
			code: `
				function Foo( { className, ...restProps } ) {
					return <div className={ className } { ...restProps } />;
				}
			`,
		},
		{
			// className merged via template literal
			code: `
				function Foo( { className, ...restProps } ) {
					return <div className={ \`\${styles.foo} \${className}\` } { ...restProps } />;
				}
			`,
		},
		{
			// className merged via string concatenation
			code: `
				function Foo( { className, ...restProps } ) {
					return <div className={ styles.foo + ' ' + className } { ...restProps } />;
				}
			`,
		},
		{
			// No spread — internal elements are fine
			code: `
				function Foo( { ...restProps } ) {
					return <div className={ styles.foo } />;
				}
			`,
		},
		{
			// No className attribute at all
			code: `
				function Foo( { ...restProps } ) {
					return <div { ...restProps } />;
				}
			`,
		},
		{
			// No rest element in destructuring
			code: `
				function Foo( { padding } ) {
					return <div className={ styles.foo } { ...someOtherSpread } />;
				}
			`,
		},
		{
			// Arrow function component
			code: `
				const Foo = ( { className, ...restProps } ) => (
					<div className={ clsx( styles.foo, className ) } { ...restProps } />
				);
			`,
		},
		{
			// className in conditional expression
			code: `
				function Foo( { className, isActive, ...restProps } ) {
					return <div className={ isActive ? className : styles.inactive } { ...restProps } />;
				}
			`,
		},
		{
			// className in logical expression
			code: `
				function Foo( { className, ...restProps } ) {
					return <div className={ className || styles.default } { ...restProps } />;
				}
			`,
		},
		{
			// className forwarded on a different element than the one with spread
			code: `
				function Foo( { className, style, ...props } ) {
					return (
						<Outer className={ clsx( styles.outer, className ) } style={ style }>
							<Inner className={ styles.inner } { ...props } />
						</Outer>
					);
				}
			`,
		},
		{
			// className destructured but not referenced — not this rule's concern
			// (would be caught by no-unused-vars)
			code: `
				function Foo( { className, ...restProps } ) {
					return <div className={ clsx( styles.foo ) } { ...restProps } />;
				}
			`,
		},
	],
	invalid: [
		{
			// className not destructured, sits in rest props
			code: `
				function Foo( { padding, ...rest } ) {
					return <div className={ clsx( styles.foo ) } { ...rest } />;
				}
			`,
			errors: [ { messageId: 'noUnmergedClassname' } ],
		},
		{
			// className not destructured, no other named props
			code: `
				function Foo( { ...others } ) {
					return <div className={ styles.foo } { ...others } />;
				}
			`,
			errors: [ { messageId: 'noUnmergedClassname' } ],
		},
		{
			// Arrow function, className not destructured
			code: `
				const Foo = ( { padding, ...props } ) => (
					<div className={ styles.foo } { ...props } />
				);
			`,
			errors: [ { messageId: 'noUnmergedClassname' } ],
		},
		{
			// Named function expression
			code: `
				const Foo = function Foo( { padding, ...rest } ) {
					return <div className={ styles.foo } { ...rest } />;
				};
			`,
			errors: [ { messageId: 'noUnmergedClassname' } ],
		},
		{
			// forwardRef pattern — className not destructured
			code: `
				const Foo = forwardRef( function Foo( { padding, ...restProps }, ref ) {
					return <div ref={ ref } className={ clsx( styles.foo ) } { ...restProps } />;
				} );
			`,
			errors: [ { messageId: 'noUnmergedClassname' } ],
		},
		{
			// Props not destructured — spread of entire props object
			code: `
				function Foo( props ) {
					return <div className={ styles.foo } { ...props } />;
				}
			`,
			errors: [ { messageId: 'noUnmergedClassname' } ],
		},
	],
} );
