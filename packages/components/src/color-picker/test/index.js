/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { DOWN, ENTER, UP } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import ColorPicker from '../';

describe( 'ColorPicker', () => {
	test( 'should render color picker', () => {
		const color = '#FFF';

		const renderer = TestRenderer.create(
			<ColorPicker
				color={ color }
				onChangeComplete={ () => {} }
				disableAlpha
			/>
		);

		expect( renderer.toJSON() ).toMatchSnapshot();
	} );

	test( 'should only update input view for draft changes', () => {
		const color = '#FFF';
		const testRenderer = TestRenderer.create(
			<ColorPicker
				color={ color }
				onChangeComplete={ () => {} }
				disableAlpha
			/>
		);
		testRenderer.root
			.findByType( 'input' )
			.props.onChange( { target: { value: '#ABC' } } );
		expect( testRenderer.toJSON() ).toMatchSnapshot();
	} );

	test( 'should commit changes to all views on blur', () => {
		const color = '#FFF';
		const testRenderer = TestRenderer.create(
			<ColorPicker
				color={ color }
				onChangeComplete={ () => {} }
				disableAlpha
			/>
		);
		testRenderer.root
			.findByType( 'input' )
			.props.onChange( { target: { value: '#ABC' } } );
		testRenderer.root.findByType( 'input' ).props.onBlur();
		expect( testRenderer.toJSON() ).toMatchSnapshot();
	} );

	test( 'should commit changes to all views on keyDown = UP', () => {
		const color = '#FFF';
		const testRenderer = TestRenderer.create(
			<ColorPicker
				color={ color }
				onChangeComplete={ () => {} }
				disableAlpha
			/>
		);
		testRenderer.root
			.findByType( 'input' )
			.props.onChange( { target: { value: '#ABC' } } );
		testRenderer.root
			.findByType( 'input' )
			.props.onKeyDown( { keyCode: UP } );
		expect( testRenderer.toJSON() ).toMatchSnapshot();
	} );

	test( 'should commit changes to all views on keyDown = DOWN', () => {
		const color = '#FFF';
		const testRenderer = TestRenderer.create(
			<ColorPicker
				color={ color }
				onChangeComplete={ () => {} }
				disableAlpha
			/>
		);
		testRenderer.root
			.findByType( 'input' )
			.props.onChange( { target: { value: '#ABC' } } );
		testRenderer.root
			.findByType( 'input' )
			.props.onKeyDown( { keyCode: DOWN } );
		expect( testRenderer.toJSON() ).toMatchSnapshot();
	} );

	test( 'should commit changes to all views on keyDown = ENTER', () => {
		const color = '#FFF';
		const testRenderer = TestRenderer.create(
			<ColorPicker
				color={ color }
				onChangeComplete={ () => {} }
				disableAlpha
			/>
		);
		testRenderer.root
			.findByType( 'input' )
			.props.onChange( { target: { value: '#ABC' } } );
		testRenderer.root
			.findByType( 'input' )
			.props.onKeyDown( { keyCode: ENTER } );
		expect( testRenderer.toJSON() ).toMatchSnapshot();
	} );
} );
