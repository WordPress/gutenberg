/**
 * Internal dependencies
 */
import { createElement, Fragment } from '../react';
import createInterpolateElement from '../create-interpolate-element';

describe( 'createInterpolateElement', () => {
	it( 'returns same string when there is no conversion map', () => {
		const testString = 'This is a string';
		expect(
			createInterpolateElement( testString, [] )
		).toEqual( <Fragment>This is a string</Fragment> );
	} );
	it( 'returns same string when there are no tokens in the string', () => {
		const testString = 'This is a string';
		expect(
			createInterpolateElement(
				testString,
				{ '%1$s': { value: 10 } }
			)
		).toEqual( <Fragment>{ testString }</Fragment> );
	} );
	it( 'returns same string when there is an invalid conversion map', () => {
		const testString = 'This is a %1$s string';
		expect(
			createInterpolateElement(
				testString,
				[ '%1$s', { value: 10 } ],
			)
		).toEqual( <Fragment>{ testString }</Fragment> );
	} );
	it( 'returns same string when there is an invalid token in the string', () => {
		const testString = 'This is a %1$s string';
		expect(
			createInterpolateElement(
				testString,
				{ '%2$s': { value: 20 } }
			)
		).toEqual( <Fragment>{ testString }</Fragment> );
	} );
	it( 'returns expected react element for non nested components', () => {
		const testString = 'This is a string with <a%1>a link</a%1>.';
		const expectedElement = createElement(
			Fragment,
			{},
			[
				'This is a string with ',
				createElement(
					'a',
					{ href: 'https://github.com', className: 'some_class', key: 0 },
					'a link'
				),
				'.',
			]
		);
		expect( createInterpolateElement(
			testString,
			{
				'a%1': {
					tag: 'a',
					props: { href: 'https://github.com', className: 'some_class' },
				},
			}
		) ).toEqual( expectedElement );
	} );
	it( 'returns expected react element for nested components', () => {
		const testString = 'This is a <a1>string that is <em1>linked</em1></a1>.';
		const expectedElement = createElement(
			Fragment,
			{},
			[
				'This is a ',
				createElement(
					'a',
					{ key: 0 },
					[
						'string that is ',
						createElement(
							'em',
							{ key: 1 },
							'linked'
						),
					]
				),
				'.',
			]
		);
		expect( createInterpolateElement(
			testString,
			{
				a1: { tag: 'a', props: {} },
				em1: { tag: 'em', props: {} },
			}
		) ).toEqual( expectedElement );
	} );
	it( 'returns a value for a prop value type token replacement', () => {
		const testString = 'This is a string with a value token: %1$s';
		const expectedElement = createElement(
			Fragment,
			{},
			[
				'This is a string with a value token: ',
				10,
			]
		);
		expect( createInterpolateElement(
			testString,
			{ '%1$s': { value: 10 } }
		) ).toEqual( expectedElement );
	} );
	it( 'returns expected output for a custom component with children ' +
		'replacement', () => {
		const TestComponent = ( props ) => {
			return <div { ...props } >{ props.children }</div>;
		};
		const testString = 'This is a string with a <span1>Custom Component</span1>';
		const expectedElement = createElement(
			Fragment,
			{},
			[
				'This is a string with a ',
				createElement(
					TestComponent,
					{ key: 0 },
					'Custom Component'
				),
			]
		);
		expect( createInterpolateElement(
			testString,
			{
				span1: { tag: TestComponent, props: {} },
			}
		) ).toEqual( expectedElement );
	} );
	it( 'returns expected output for self closing custom component', () => {
		const TestComponent = ( props ) => {
			return <div { ...props } />;
		};
		const testString = 'This is a string with a self closing custom component: <span1/>';
		const expectedElement = createElement(
			Fragment,
			{},
			[
				'This is a string with a self closing custom component: ',
				createElement(
					TestComponent,
					{ key: 0 }
				),
			]
		);
		expect( createInterpolateElement(
			testString,
			{
				span1: { tag: TestComponent, props: {} },
			}
		) ).toEqual( expectedElement );
	} );
	it( 'returns expected output for complex replacement', () => {
		const TestComponent = ( props ) => {
			return <div { ...props } />;
		};
		const testString = 'This is a complex string having a %1$s value, with ' +
			'a <a1>nested <em1>%2$s</em1> link</a1> and value: %3$s';
		const expectedElement = createElement(
			Fragment,
			{},
			[
				'This is a complex string having a ',
				'concrete',
				' value, with a ',
				createElement(
					'a',
					{ key: 0 },
					[
						'nested ',
						createElement(
							'em',
							{ key: 1 },
							'value'
						),
						' link',
					]
				),
				' and value: ',
				createElement(
					Fragment,
					{ key: 2 },
					<TestComponent />,
				),
			]
		);
		expect( JSON.stringify( createInterpolateElement(
			testString,
			{
				'%1$s': { value: 'concrete' },
				a1: { tag: 'a', props: {} },
				em1: { tag: 'em', props: {} },
				'%2$s': { value: 'value' },
				'%3$s': { value: <TestComponent /> },
			}
		) ) ).toEqual( JSON.stringify( expectedElement ) );
	} );
	// test complex multi types replacements.
} );
