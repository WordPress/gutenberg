import TestRenderer from 'react-test-renderer';
import { Input } from '../inputs';
import { DOWN, ENTER, SPACE, UP } from '@wordpress/keycodes';

describe( 'Input ', () => {
	describe( 'calls onChange prop with commit state', () => {
		test( 'onKeyDown = ENTER', () => {
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
			expect( onChange ).toHaveBeenCalledWith( {
				state: 'commit',
				hex: '#fff',
			} );
		} );

		test( 'onKeyDown = UP', () => {
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
			expect( onChange ).toHaveBeenCalledWith( {
				state: 'commit',
				hex: '#fff',
			} );
		} );

		test( 'onKeyDown = DOWN', () => {
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
			expect( onChange ).toHaveBeenCalledWith( {
				state: 'commit',
				hex: '#fff',
			} );
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
			testInstance.findByType( 'input' ).props.onChange( { target: { value: '#aaaaaa' } } );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( {
				state: 'commit',
				hex: '#aaaaaa',
			} );
		} );

		test( 'onBlur', () => {
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
			expect( onChange ).toHaveBeenCalledWith( {
				state: 'commit',
				hex: '#fff',
			} );
		} );
	} );

	describe( 'does call onChange with draft state', () => {
		test( 'onChange event for value.length <= 4', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance.findByType( 'input' ).props.onChange( { target: { value: '#aaaaa' } } );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( {
				state: 'draft',
				hex: '#aaaaa',
			} );
		} );
	} );

	describe( 'does not call onChange', () => {
		test( 'onKeyDown not ENTER, DOWN, or UP', () => {
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
	} );
} );
