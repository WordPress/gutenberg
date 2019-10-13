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
		).toEqual( 'This is a string' );
	} );
	it( 'returns same string when there are no tokens in the string', () => {
		const testString = 'This is a string';
		expect(
			createInterpolateElement(
				testString,
				{ someValue: { value: 10 } }
			)
		).toEqual( <Fragment>{ testString }</Fragment> );
	} );
	it( 'returns same string when there is an invalid conversion map', () => {
		const testString = 'This is a <someValue/> string';
		expect(
			createInterpolateElement(
				testString,
				[ 'someValue', { value: 10 } ],
			)
		).toEqual( testString );
	} );
	it( 'returns same string when there is an non matching token in the ' +
     'string', () => {
		const testString = 'This is a <nonParsed/> string';
		expect(
			createInterpolateElement(
				testString,
				{ someValue: { value: 20 } }
			)
		).toEqual( <Fragment>{ testString }</Fragment> );
	} );
	it( 'returns expected react element for non nested components', () => {
		const testString = 'This is a string with <a>a link</a>.';
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
				a: {
					tag: 'a',
					props: { href: 'https://github.com', className: 'some_class' },
				},
			}
		) ).toEqual( expectedElement );
	} );
	it( 'returns expected react element for nested components', () => {
		const testString = 'This is a <a>string that is <em>linked</em></a>.';
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
				a: { tag: 'a', props: {} },
				em: { tag: 'em', props: {} },
			}
		) ).toEqual( expectedElement );
	} );
	it( 'returns a value for a prop value type token replacement', () => {
		const testString = 'This is a string with a value token: <someValue/>';
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
			{ someValue: { value: 10 } }
		) ).toEqual( expectedElement );
	} );
	it( 'returns expected output for a custom component with children ' +
		'replacement', () => {
		const TestComponent = ( props ) => {
			return <div { ...props } >{ props.children }</div>;
		};
		const testString = 'This is a string with a <span>Custom Component</span>';
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
				span: { tag: TestComponent, props: {} },
			}
		) ).toEqual( expectedElement );
	} );
	it( 'returns expected output for self closing custom component', () => {
		const TestComponent = ( props ) => {
			return <div { ...props } />;
		};
		const testString = 'This is a string with a self closing custom component: <span/>';
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
				span: { tag: TestComponent, props: {} },
			}
		) ).toEqual( expectedElement );
	} );
	it( 'returns expected output for complex replacement', () => {
		const TestComponent = ( props ) => {
			return <div { ...props } />;
		};
		const testString = 'This is a complex string having a <concrete/> value, with ' +
			'a <a1>nested <em1><value/></em1> link</a1> and value: <TestComponent/>';
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
				TestComponent: { value: <TestComponent /> },
				concrete: { value: 'concrete' },
				em1: { tag: 'em', props: {} },
				value: { value: 'value' },
				a1: { tag: 'a', props: {} },
			}
		) ) ).toEqual( JSON.stringify( expectedElement ) );
	} );
	// test complex multi types replacements.
} );
