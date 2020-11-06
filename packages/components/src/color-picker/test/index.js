/**
 * External dependencies
 */
import { create, act } from 'react-test-renderer';

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
		let renderer;

		act( () => {
			renderer = create(
				<ColorPicker
					color={ color }
					onChangeComplete={ () => {} }
					disableAlpha
				/>
			);
		} );
	});

	test( 'should render color picker', () => {
		expect( base.toJSON() ).toMatchSnapshot();
	} );

	test( 'should only update input view for draft changes', () => {
		const color = '#FFF';
		let testRenderer;

		act( () => {
			testRenderer = create(
				<ColorPicker
					color={ color }
					onChangeComplete={ () => {} }
					disableAlpha
				/>
			);
		} );

		act( () => {
			testRenderer.root
				.findByType( 'input' )
				.props.onChange( { target: { value: '#ABC' } } );
		} );

		expect( testRenderer.toJSON() ).toMatchSnapshot();
	} );

	test( 'should commit changes to all views on blur', () => {
		const color = '#FFF';
		let testRenderer;

		act( () => {
			testRenderer = create(
				<ColorPicker
					color={ color }
					onChangeComplete={ () => {} }
					disableAlpha
				/>
			);
		} );

		act( () => {
			testRenderer.root
				.findByType( 'input' )
				.props.onChange( { target: { value: '#ABC' } } );
		} );

		act( () => {
			testRenderer.root.findByType( 'input' ).props.onBlur();
		} );

		expect( testRenderer.toJSON() ).toMatchSnapshot();
	} );

	test( 'should commit changes to all views on keyDown = UP', () => {
		const color = '#FFF';
		let testRenderer;

		act( () => {
			testRenderer = create(
				<ColorPicker
					color={ color }
					onChangeComplete={ () => {} }
					disableAlpha
				/>
			);
		} );

		act( () => {
			testRenderer.root
				.findByType( 'input' )
				.props.onChange( { target: { value: '#ABC' } } );
		} );

		act( () => {
			testRenderer.root
				.findByType( 'input' )
				.props.onKeyDown( { keyCode: UP } );
		} );

		expect( testRenderer.toJSON() ).toMatchSnapshot();
	} );

	test( 'should commit changes to all views on keyDown = DOWN', () => {
		const color = '#FFF';
		let testRenderer;

		act( () => {
			testRenderer = create(
				<ColorPicker
					color={ color }
					onChangeComplete={ () => {} }
					disableAlpha
				/>
			);
		} );

		act( () => {
			testRenderer.root
				.findByType( 'input' )
				.props.onChange( { target: { value: '#ABC' } } );
		} );

		act( () => {
			testRenderer.root
				.findByType( 'input' )
				.props.onKeyDown( { keyCode: DOWN } );
		} );

		expect( testRenderer.toJSON() ).toMatchSnapshot();
	} );

	test( 'should commit changes to all views on keyDown = ENTER', () => {
		const color = '#FFF';
		let testRenderer;

		act( () => {
			testRenderer = create(
				<ColorPicker
					color={ color }
					onChangeComplete={ () => {} }
					disableAlpha
				/>
			);
		} );

		act( () => {
			testRenderer.root
				.findByType( 'input' )
				.props.onChange( { target: { value: '#ABC' } } );
		} );

		act( () => {
			testRenderer.root
				.findByType( 'input' )
				.props.onKeyDown( { keyCode: ENTER } );
		} );

		expect( testRenderer.toJSON() ).toMatchSnapshot();
	} );
} );
