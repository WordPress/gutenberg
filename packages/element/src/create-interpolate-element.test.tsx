/**
 * External dependencies
 */
// eslint-disable-next-line import/no-extraneous-dependencies
import { describe, it, expect, jest } from '@jest/globals';

/**
 * Internal dependencies
 */
import createInterpolateElement from './create-interpolate-element';

describe( 'createInterpolateElement', () => {
	it( 'should return a string if no tags are specified', () => {
		const result = createInterpolateElement( 'a', {} );
		const { children } = result.props;

		expect( children ).toEqual( [ 'a' ] );
	} );

	it( 'should return a string if no tags are matched', () => {
		const result = createInterpolateElement( 'a', { b: <b /> } );
		const { children } = result.props;

		expect( children ).toEqual( [ 'a' ] );
	} );

	it( 'should return a simple element', () => {
		const result = createInterpolateElement( '<a>b</a>', {
			a: <a href="https://example.com">_</a>,
		} );
		const { children } = result.props;

		expect( children ).toEqual( [
			<a href="https://example.com" key="a">
				b
			</a>,
		] );
	} );

	it( 'should return multiple elements', () => {
		const result = createInterpolateElement( '<a>b</a><a>c</a>', {
			a: <a href="https://example.com">_</a>,
		} );
		const { children } = result.props;

		expect( children ).toEqual( [
			<a href="https://example.com" key="a">
				b
			</a>,
			<a href="https://example.com" key="a">
				c
			</a>,
		] );
	} );

	it( 'should return nested elements', () => {
		const result = createInterpolateElement( '<a><b>c</b></a>', {
			a: <a href="https://example.com">_</a>,
			b: <b />,
		} );
		const { children } = result.props;
		expect( children ).toEqual( [
			<a href="https://example.com" key="a">
				<b key="b">c</b>
			</a>,
		] );
	} );

	it( 'should return text and elements', () => {
		const result = createInterpolateElement( 'a<b>c</b>d', {
			b: <b />,
		} );
		const { children } = result.props;

		expect( children ).toEqual( [ 'a', <b key="b">c</b>, 'd' ] );
	} );

	it( 'should handle self-closing tags', () => {
		const result = createInterpolateElement( 'a<b/>d', { b: <b /> } );
		const { children } = result.props;

		expect( children ).toEqual( [ 'a', <b key="b" />, 'd' ] );
	} );

	it( 'should handle a complicated scenario', () => {
		const result = createInterpolateElement(
			'a<a>b<span>d</span>e<br/>g</a>h',
			{
				a: <a href="https://example.com">_</a>,
				span: <span />,
				br: <br />,
			}
		);
		const { children } = result.props;

		expect( children ).toEqual( [
			'a',
			<a href="https://example.com" key="a">
				b<span key="span">d</span>e<br key="br" />g
			</a>,
			'h',
		] );
	} );

	// This is your new test case, added at the end.
	it( 'should handle an unmatched closing tag without crashing', () => {
		const consoleErrorSpy = jest
			.spyOn( console, 'error' )
			.mockImplementation( () => {} );

		const element = createInterpolateElement( 'Hello </code>World', {
			code: <code />,
		} );

		// The function returns a React Fragment. We check its children.
		// The invalid tag should be ignored, leaving only the text.
		expect( element.props.children ).toEqual( [ 'Hello ', 'World' ] );

		// Check that our specific error message was logged.
		expect( consoleErrorSpy ).toHaveBeenCalledWith(
			'Unmatched closing tag "code" found.'
		);

		// Clean up the spy.
		consoleErrorSpy.mockRestore();
	} );
} );
