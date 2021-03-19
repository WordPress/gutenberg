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
	const color = '#FFF';
	const source = 'hex';
	let base;

	beforeEach( () => {
		base = TestRenderer.create(
			<ColorPicker
				color={ color }
				source={ source }
				onChangeComplete={ () => {} }
				onSourceChangeComplete={ () => {} }
				disableAlpha
			/>
		);
	} );

	test( 'should render color picker', () => {
		expect( base.toJSON() ).toMatchSnapshot();
	} );

	test( 'should only update input view for draft changes', () => {
		const testRenderer = TestRenderer.create(
			<ColorPicker
				color={ color }
				source={ source }
				onSourceChangeComplete={ () => {} }
				onChangeComplete={ () => {} }
				disableAlpha
			/>
		);
		testRenderer.root
			.findByType( 'input' )
			.props.onChange( { target: { value: '#ABC' } } );

		expect( testRenderer.toJSON() ).toMatchDiffSnapshot( base.toJSON() );
	} );

	test( 'should commit changes to all views on blur', () => {
		const testRenderer = TestRenderer.create(
			<ColorPicker
				color={ color }
				source={ source }
				onSourceChangeComplete={ () => {} }
				onChangeComplete={ () => {} }
				disableAlpha
			/>
		);
		testRenderer.root
			.findByType( 'input' )
			.props.onChange( { target: { value: '#ABC' } } );
		testRenderer.root.findByType( 'input' ).props.onBlur();

		expect( testRenderer.toJSON() ).toMatchDiffSnapshot( base.toJSON() );
	} );

	test( 'should commit changes to all views on keyDown = UP', () => {
		const testRenderer = TestRenderer.create(
			<ColorPicker
				color={ color }
				source={ source }
				onSourceChangeComplete={ () => {} }
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

		expect( testRenderer.toJSON() ).toMatchDiffSnapshot( base.toJSON() );
	} );

	test( 'should commit changes to all views on keyDown = DOWN', () => {
		const testRenderer = TestRenderer.create(
			<ColorPicker
				color={ color }
				source={ source }
				onSourceChangeComplete={ () => {} }
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

		expect( testRenderer.toJSON() ).toMatchDiffSnapshot( base.toJSON() );
	} );

	test( 'should commit changes to all views on keyDown = ENTER', () => {
		const testRenderer = TestRenderer.create(
			<ColorPicker
				color={ color }
				source={ source }
				onSourceChangeComplete={ () => {} }
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

		expect( testRenderer.toJSON() ).toMatchDiffSnapshot( base.toJSON() );
	} );

	test( 'should commit color source mode changes when switching between views', () => {
		const testRenderer = TestRenderer.create(
			<ColorPicker
				color={ color }
				source={ source }
				onSourceChangeComplete={ () => {} }
				onChangeComplete={ () => {} }
				disableAlpha
			/>
		);

		testRenderer.root
			.findByProps( {
				className: 'components-color-picker__inputs-toggle',
			} )
			.props.onClick();

		expect( testRenderer.toJSON() ).toMatchDiffSnapshot( base.toJSON() );
	} );
} );
