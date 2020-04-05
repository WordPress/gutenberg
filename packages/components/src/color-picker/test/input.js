/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * WordPress dependencies
 */
import { DOWN, ENTER, SPACE, UP } from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import { Input } from '../inputs';

describe( 'Input ', () => {
	describe( 'calls onChange prop with commit state', () => {
		test( 'onKeyDown = ENTER', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					source="rgb"
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance
				.findByType( 'input' )
				.props.onKeyDown( { keyCode: ENTER } );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( {
				source: 'rgb',
				state: 'commit',
				value: '#fff',
				valueKey: 'hex',
			} );
		} );

		test( 'onKeyDown = UP', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					source="rgb"
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance
				.findByType( 'input' )
				.props.onKeyDown( { keyCode: UP } );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( {
				source: 'rgb',
				state: 'commit',
				value: '#fff',
				valueKey: 'hex',
			} );
		} );

		test( 'onKeyDown = DOWN', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					source="rgb"
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance
				.findByType( 'input' )
				.props.onKeyDown( { keyCode: DOWN } );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( {
				source: 'rgb',
				state: 'commit',
				value: '#fff',
				valueKey: 'hex',
			} );
		} );

		test( 'onChange event for value.length > 4', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					source="rgb"
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance
				.findByType( 'input' )
				.props.onChange( { target: { value: '#aaaaaa' } } );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( {
				source: 'rgb',
				state: 'commit',
				value: '#aaaaaa',
				valueKey: 'hex',
			} );
		} );

		test( 'onBlur', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					source="rgb"
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance.findByType( 'input' ).props.onBlur();
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( {
				source: 'rgb',
				state: 'commit',
				value: '#fff',
				valueKey: 'hex',
			} );
		} );
	} );

	describe( 'does call onChange with draft state', () => {
		test( 'onChange event for value.length <= 4', () => {
			const onChange = jest.fn();
			const testInstance = TestRenderer.create(
				<Input
					source="rgb"
					label={ 'Color value in hexadecimal' }
					valueKey="hex"
					value={ '#fff' }
					onChange={ onChange }
				/>
			).root;
			testInstance
				.findByType( 'input' )
				.props.onChange( { target: { value: '#aaaaa' } } );
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange ).toHaveBeenCalledWith( {
				source: 'rgb',
				state: 'draft',
				value: '#aaaaa',
				valueKey: 'hex',
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
			testInstance
				.findByType( 'input' )
				.props.onKeyDown( { keyCode: SPACE } );
			expect( onChange ).not.toHaveBeenCalled();
		} );
	} );
} );
