/**
 * External dependencies
 */
import TestRenderer, { act } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import { createElement, Fragment, Component } from '../react';
import createInterpolateElement from '../create-interpolate-element';

describe( 'createInterpolateElement', () => {
	it( 'throws an error when there is no conversion map', () => {
		const testString = 'This is a string';
		expect( () => createInterpolateElement( testString, {} ) ).toThrow(
			TypeError
		);
	} );
	it( 'returns same string when there are no tokens in the string', () => {
		const testString = 'This is a string';
		const expectedElement = <>{ testString }</>;
		expect(
			createInterpolateElement( testString, { someValue: <em /> } )
		).toEqual( expectedElement );
	} );
	it( 'throws an error when there is an invalid conversion map', () => {
		const testString = 'This is a <someValue/> string';
		expect( () =>
			createInterpolateElement( testString, [
				'someValue',
				{ value: 10 },
			] )
		).toThrow( TypeError );
	} );
	it(
		'throws an error when there is an invalid entry in the conversion ' +
			'map',
		() => {
			const testString = 'This is a <item /> string and <somethingElse/>';
			expect( () =>
				createInterpolateElement( testString, {
					someValue: <em />,
					somethingElse: 10,
				} )
			).toThrow( TypeError );
		}
	);
	it(
		'returns same string when there is an non matching token in the ' +
			'string',
		() => {
			const testString = 'This is a <non_parsed/> string';
			const expectedElement = <>{ testString }</>;
			expect(
				createInterpolateElement( testString, {
					someValue: <strong />,
				} )
			).toEqual( expectedElement );
		}
	);
	it( 'returns same string when there is spaces in the token', () => {
		const testString = 'This is a <spaced token/>string';
		const expectedElement = <>{ testString }</>;
		expect(
			createInterpolateElement( testString, { 'spaced token': <em /> } )
		).toEqual( expectedElement );
	} );
	it( 'returns expected react element for non nested components', () => {
		const testString = 'This is a string with <a>a link</a>.';
		const expectedElement = createElement(
			Fragment,
			null,
			'This is a string with ',
			createElement(
				'a',
				{ href: 'https://github.com', className: 'some_class' },
				'a link'
			),
			'.'
		);
		const component = createInterpolateElement( testString, {
			// eslint-disable-next-line jsx-a11y/anchor-has-content
			a: <a href={ 'https://github.com' } className={ 'some_class' } />,
		} );
		expect( JSON.stringify( component ) ).toEqual(
			JSON.stringify( expectedElement )
		);
	} );
	it( 'returns expected react element for nested components', () => {
		const testString = 'This is a <a>string that is <em>linked</em></a>.';
		const expectedElement = createElement(
			Fragment,
			{},
			'This is a ',
			createElement(
				'a',
				null,
				'string that is ',
				createElement( 'em', null, 'linked' )
			),
			'.'
		);
		expect(
			JSON.stringify(
				createInterpolateElement( testString, {
					a: createElement( 'a' ),
					em: <em />,
				} )
			)
		).toEqual( JSON.stringify( expectedElement ) );
	} );
	it(
		'returns expected output for a custom component with children ' +
			'replacement',
		() => {
			const TestComponent = ( props ) => {
				return <div { ...props }>{ props.children }</div>;
			};
			const testString =
				'This is a string with a <TestComponent>Custom Component</TestComponent>';
			const expectedElement = createElement(
				Fragment,
				null,
				'This is a string with a ',
				createElement( TestComponent, null, 'Custom Component' )
			);
			expect(
				JSON.stringify(
					createInterpolateElement( testString, {
						TestComponent: <TestComponent />,
					} )
				)
			).toEqual( JSON.stringify( expectedElement ) );
		}
	);
	it( 'returns expected output for self closing custom component', () => {
		const TestComponent = ( props ) => {
			return <div { ...props } />;
		};
		const testString =
			'This is a string with a self closing custom component: <TestComponent/>';
		const expectedElement = createElement(
			Fragment,
			null,
			'This is a string with a self closing custom component: ',
			createElement( TestComponent )
		);
		expect(
			JSON.stringify(
				createInterpolateElement( testString, {
					TestComponent: <TestComponent />,
				} )
			)
		).toEqual( JSON.stringify( expectedElement ) );
	} );
	it( 'throws an error with an invalid element in the conversion map', () => {
		const test = () =>
			createInterpolateElement( 'This is a <invalid /> string', {
				invalid: 10,
			} );
		expect( test ).toThrow( TypeError );
	} );
	it( 'returns expected output for complex replacement', () => {
		class TestComponent extends Component {
			render( props ) {
				return <div { ...props } />;
			}
		}
		const testString =
			'This is a complex string with ' +
			'a <a1>nested <em1>emphasized string</em1> link</a1> and value: <TestComponent/>';
		const expectedElement = createElement(
			Fragment,
			null,
			'This is a complex string with a ',
			createElement(
				'a',
				null,
				'nested ',
				createElement( 'em', null, 'emphasized string' ),
				' link'
			),
			' and value: ',
			createElement( TestComponent )
		);
		expect(
			JSON.stringify(
				createInterpolateElement( testString, {
					TestComponent: <TestComponent />,
					em1: <em />,
					a1: createElement( 'a' ),
				} )
			)
		).toEqual( JSON.stringify( expectedElement ) );
	} );
	it( 'renders expected components across renders for keys in use', () => {
		const TestComponent = ( { switchKey } ) => {
			const elementConfig = switchKey
				? { item: <em /> }
				: { item: <strong /> };
			return (
				<div>
					{ createInterpolateElement(
						'This is a <item>string!</item>',
						elementConfig
					) }
				</div>
			);
		};
		let renderer;
		act( () => {
			renderer = TestRenderer.create(
				<TestComponent switchKey={ true } />
			);
		} );
		expect( () => renderer.root.findByType( 'em' ) ).not.toThrow();
		expect( () => renderer.root.findByType( 'strong' ) ).toThrow();
		act( () => {
			renderer.update( <TestComponent switchKey={ false } /> );
		} );
		expect( () => renderer.root.findByType( 'strong' ) ).not.toThrow();
		expect( () => renderer.root.findByType( 'em' ) ).toThrow();
	} );
	it( 'handles parsing emojii correctly', () => {
		const testString = '👳‍♀️<icon>🚨🤷‍♂️⛈️fully</icon> here';
		const expectedElement = createElement(
			Fragment,
			null,
			'👳‍♀️',
			createElement( 'strong', null, '🚨🤷‍♂️⛈️fully' ),
			' here'
		);
		expect(
			JSON.stringify(
				createInterpolateElement( testString, {
					icon: <strong />,
				} )
			)
		).toEqual( JSON.stringify( expectedElement ) );
	} );
} );
