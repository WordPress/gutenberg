/**
 * Internal dependencies
 */
import { Fragment } from '../../../../react';
import createInterpolateString from '../create-interpolate-string';

describe( 'createInterpolateString', () => {
	// test converting native component with children to string
	test( 'converting native component with children to string', () => {
		const testElement = <Fragment>This is a string <a href={ 'https://exmaple.org' }>with a link</a></Fragment>;
		const expectedString = 'This is a string <a%1>with a link</a%1>';
		expect( createInterpolateString( testElement, {} ) )
			.toEqual( expectedString );
	} );
	test( 'converting value token without defined prop for it', () => {
		const testElement = <Fragment>This is a %%special%% value</Fragment>;
		const test = () => createInterpolateString( testElement, {} );
		expect( test ).toThrowError();
	} );
	test( 'converting value token with defined prop for it', () => {
		const testElement = <Fragment>This is a %%special%% value.</Fragment>;
		const expectedString = 'This is a %1$s value.';
		expect( createInterpolateString( testElement, { special: 'super great' } ) )
			.toEqual( expectedString );
	} );
	test( 'converting custom component with children to string', () => {
		const TestComponent = ( props ) => <div { ...props }>{ props.children }</div>;
		const testElement = <Fragment>This is a string with a <TestComponent>test component</TestComponent>.</Fragment>;
		const expectedString = 'This is a string with a <span%1>test component</span%1>.';
		expect( createInterpolateString( testElement, {} ) )
			.toEqual( expectedString );
	} );
	test( 'converting nested native components', () => {
		const testElement = <Fragment>
			This is a <a href={ 'https://example.org' }>link with some <em>emphasis</em></a>
		</Fragment>;
		const expectedString = 'This is a <a%1>link with some <em%1>emphasis</em%1></a%1>';
		expect( createInterpolateString( testElement, {} ) )
			.toEqual( expectedString );
	} );
	test( 'converting nested native + custom component with child', () => {
		const TestComponent = ( props ) => <div { ...props }>{ props.children }</div>;
		const testElement = <Fragment>
				This is a <div>nested div with a <TestComponent>nested custom component</TestComponent></div>.
		</Fragment>;
		const expectedString = 'This is a <div%1>nested div with a <span%1>nested ' +
			'custom component</span%1></div%1>.';
		expect( createInterpolateString( testElement, {} ) )
			.toEqual( expectedString );
	} );
	test( 'converting self-closing native component', () => {
		const testElement = <Fragment>This is a <br /></Fragment>;
		const expectedString = 'This is a <br%1/>';
		expect( createInterpolateString( testElement, {} ) )
			.toEqual( expectedString );
	} );
	test( 'converting self-closing custom component', () => {
		const TestComponent = ( props ) => <div { ...props } />;
		const testElement = <Fragment>This is a <TestComponent /></Fragment>;
		const expectedString = 'This is a %1$s';
		expect( createInterpolateString( testElement, {} ) )
			.toEqual( expectedString );
	} );
	test( 'converting complex element conversion', () => {
		const TestComponent = ( props ) => <div { ...props } />;
		const testElement = <Fragment>
			A string with %%tokens%%, a <TestComponent /> and <a href={ 'http://example.org' }>some <em>%%special^value%%</em></a>. Also <a href={ 'https://example.org' }>another <strong>link</strong></a>.
		</Fragment>;
		const expectedString = 'A string with %1$s, a %2$s and <a%1>some ' +
			'<em%1>%3$s</em%1></a%1>. Also <a%2>another <strong%1>link</strong%1>' +
			'</a%2>.';
		expect( createInterpolateString(
			testElement,
			{
				tokens: 10,
				'special^value': 'cheeseburger',
			} ) ).toEqual( expectedString );
	} );
} );
