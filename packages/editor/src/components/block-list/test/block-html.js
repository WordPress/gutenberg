/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { createBlock } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import { BlockHTML } from '../block-html';

describe( 'BlockHTML', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	it( 'renders HTML editor', () => {
		const wrapper = shallow( <BlockHTML block={ { isValid: true } } /> );

		expect( wrapper.name() ).toBe( 'TextareaAutosize' );
	} );

	describe( 'block content', () => {
		it( 'use originalContent for an invalid block', () => {
			const wrapper = shallow( <BlockHTML block={ { isValid: false, originalContent: 'test' } } /> );

			expect( wrapper.state( 'html' ) ).toBe( 'test' );
		} );

		it( 'use block content for a valid block', () => {
			const block = createBlock( 'core/paragraph', {
				content: 'test-block',
				isValid: true,
			} );

			const wrapper = shallow( <BlockHTML block={ block } /> );

			expect( wrapper.state( 'html' ) ).toBe( '<p>test-block</p>' );
		} );

		it( 'onChange updates block html', () => {
			const wrapper = shallow( <BlockHTML block={ { isValid: true } } /> );

			wrapper.instance().onChange( { target: { value: 'update' } } );

			expect( wrapper.state( 'html' ) ).toBe( 'update' );
		} );
	} );

	describe( 'onBlur', () => {
		const onChange = jest.fn();

		beforeEach( () => {
			onChange.mockClear();
		} );

		it( 'onBlur updates valid HTML string in block', () => {
			const block = createBlock( 'core/paragraph', {
				content: 'test-block',
				isValid: true,
			} );
			const wrapper = shallow( <BlockHTML block={ block } onChange={ onChange } /> );

			wrapper.instance().onChange( { target: { value: '<p>update</p>' } } );
			wrapper.instance().onBlur();

			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange.mock.calls[ 0 ][ 2 ] ).toBe( '<p>update</p>' );
			expect( onChange.mock.calls[ 0 ][ 3 ] ).toBe( true );
		} );

		it( 'onBlur updates invalid HTML string in block', () => {
			const block = createBlock( 'core/paragraph', {
				content: 'test-block',
				isValid: true,
			} );
			const wrapper = shallow( <BlockHTML block={ block } onChange={ onChange } /> );

			wrapper.instance().onChange( { target: { value: '<p>update' } } );
			wrapper.instance().onBlur();

			expect( console ).toHaveErrored();
			expect( console ).toHaveWarned();
			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange.mock.calls[ 0 ][ 2 ] ).toBe( '<p>update' );
			expect( onChange.mock.calls[ 0 ][ 3 ] ).toBe( false );
		} );

		it( 'onBlur resets block to default content if supplied empty string', () => {
			const block = createBlock( 'core/paragraph', {
				content: 'test-block',
				isValid: true,
			} );
			const wrapper = shallow( <BlockHTML block={ block } onChange={ onChange } /> );

			wrapper.instance().onChange( { target: { value: '' } } );
			wrapper.instance().onBlur();

			expect( onChange ).toHaveBeenCalledTimes( 1 );
			expect( onChange.mock.calls[ 0 ][ 2 ] ).toBe( '<p></p>' );
			expect( onChange.mock.calls[ 0 ][ 3 ] ).toBe( true );
			expect( wrapper.state( 'html' ) ).toBe( '<p></p>' );
		} );
	} );
} );
