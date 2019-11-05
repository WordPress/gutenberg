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
		).toBe( 'This is a string' );
	} );
	it( 'returns same string when there are no tokens in the string', () => {
		const testString = 'This is a string';
		expect(
			createInterpolateElement(
				testString,
				{ someValue: [ 'someValue' ] }
			)
		).toBe( testString );
	} );
	it( 'returns same string when there is an invalid conversion map', () => {
		const testString = 'This is a <someValue/> string';
		expect(
			createInterpolateElement(
				testString,
				[ 'someValue', { value: 10 } ],
			)
		).toBe( testString );
	} );
	it( 'returns same string when there is an non matching token in the ' +
     'string', () => {
		const testString = 'This is a <non_parsed/> string';
		expect(
			createInterpolateElement(
				testString,
				{ someValue: [ 'someValue' ] }
			)
		).toBe( testString );
	} );
	it( 'returns same string when there is spaces in the token', () => {
		const testString = 'This is a <spaced token/>string';
		expect(
			createInterpolateElement(
				testString,
				{ 'spaced token': [ 'a' ] }
			)
		).toBe( testString );
	} );
	it( 'returns string without unbalanced tags', () => {
		const testString = 'This is a <em>string';
		expect(
			createInterpolateElement(
				testString,
				{ em: [ 'em' ] }
			)
		).toBe( 'This is a string' );
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
					[ 'a link' ]
				),
				'.',
			]
		);
		const component = createInterpolateElement(
			testString,
			{
				a: [ 'a', { href: 'https://github.com', className: 'some_class' } ],
			}
		);
		expect(
			JSON.stringify( component )
		).toEqual(
			JSON.stringify( expectedElement )
		);
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
					{ key: 1 },
					[
						'string that is ',
						createElement(
							'em',
							{ key: 0 },
							[ 'linked' ]
						),
					]
				),
				'.',
			]
		);
		expect( JSON.stringify( createInterpolateElement(
			testString,
			{
				a: [ 'a' ],
				em: [ 'em' ],
			}
		) ) ).toEqual( JSON.stringify( expectedElement ) );
	} );
	it( 'returns expected output for a custom component with children ' +
		'replacement', () => {
		const TestComponent = ( props ) => {
			return <div { ...props } >{ props.children }</div>;
		};
		const testString = 'This is a string with a <TestComponent>Custom Component</TestComponent>';
		const expectedElement = createElement(
			Fragment,
			{},
			[
				'This is a string with a ',
				createElement(
					TestComponent,
					{ key: 0 },
					[ 'Custom Component' ]
				),
			]
		);
		expect( JSON.stringify( createInterpolateElement(
			testString,
			{
				TestComponent: [ TestComponent ],
			}
		) ) ).toEqual( JSON.stringify( expectedElement ) );
	} );
	it( 'returns expected output for self closing custom component', () => {
		const TestComponent = ( props ) => {
			return <div { ...props } />;
		};
		const testString = 'This is a string with a self closing custom component: <TestComponent/>';
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
		expect( JSON.stringify( createInterpolateElement(
			testString,
			{
				TestComponent: [ TestComponent ],
			}
		) ) ).toEqual( JSON.stringify( expectedElement ) );
	} );
	it( 'returns expected output for complex replacement', () => {
		const TestComponent = ( props ) => {
			return <div { ...props } />;
		};
		const testString = 'This is a complex string with ' +
			'a <a1>nested <em1>emphasized string</em1> link</a1> and value: <TestComponent/>';
		const expectedElement = createElement(
			Fragment,
			{},
			[
				'This is a complex string with a ',
				createElement(
					'a',
					{ key: 1 },
					[
						'nested ',
						createElement(
							'em',
							{ key: 0 },
							[ 'emphasized string' ]
						),
						' link',
					]
				),
				' and value: ',
				createElement(
					TestComponent,
					{ key: 2 }
				),
			]
		);
		expect( JSON.stringify( createInterpolateElement(
			testString,
			{
				TestComponent: [ TestComponent ],
				em1: [ 'em' ],
				a1: [ 'a' ],
			}
		) ) ).toEqual( JSON.stringify( expectedElement ) );
	} );
} );
