import TestRenderer from 'react-test-renderer';
import { Input } from '../inputs';
import { DOWN, ENTER, SPACE, UP } from '@wordpress/keycodes';

describe( 'Input ', () => {
	describe( 'calls onChange prop', () => {
		test( 'onKeyDown event for keyDown = ENTER', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance.findByType( 'input' ).props.onKeyDown( { keyCode: ENTER } );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'onKeyDown event for keyDown = UP', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance.findByType( 'input' ).props.onKeyDown( { keyCode: UP } );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'onKeyDown event for keyDown = DOWN', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance.findByType( 'input' ).props.onKeyDown( { keyCode: DOWN } );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'onChange event for value.length > 4', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance.findByType( 'input' ).props.onChange( { target: { value: '#ffffff' } } );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
		} );

		test( 'onBlur event', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance.findByType( 'input' ).props.onBlur();
			expect( onChange ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'does not call onChange prop', () => {
		test( 'onKeyDown event when keyDown is not ENTER, DOWN, or UP', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance.findByType( 'input' ).props.onKeyDown( { keyCode: SPACE } );
			expect( onChange ).not.toHaveBeenCalled();
		} );

		test( 'onChange when value.length <= 4', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance.findByType( 'input' ).props.onChange( { target: { value: '#fff' } } );
			expect( onChange ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'is re-rendered', () => {
		test( 'onChange event for value.length <= 4', () => {
			const onChange = jest.fn();
			const testRenderer = TestRenderer.create(
				<Input
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#aaa' }
					onChange={ onChange }
				/>
			);
			testRenderer.root.findByType( 'input' ).props.onChange( { target: { value: '#fff' } } );
			expect( testRenderer.toJSON() ).toMatchSnapshot();
		} );

		test( 'onChange event for value.length > 4', () => {
			const onChange = jest.fn();
			const testRenderer = TestRenderer.create(
				<Input
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#aaa' }
					onChange={ onChange }
				/>
			);
			testRenderer.root.findByType( 'input' ).props.onChange( { target: { value: '#ffffff' } } );
			expect( testRenderer.toJSON() ).toMatchSnapshot();
		} );
	} );
} );
