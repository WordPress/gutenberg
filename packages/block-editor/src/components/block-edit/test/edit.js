/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { Edit } from '../edit';

describe( 'Edit', () => {
	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should return null if block type not defined', () => {
		const wrapper = shallow( <Edit name="core/test-block" /> );

		expect( wrapper.type() ).toBe( null );
	} );

	it( 'should use edit implementation of block', () => {
		const edit = () => <div />;
		registerBlockType( 'core/test-block', {
			save: noop,
			category: 'common',
			title: 'block title',
			edit,
		} );

		const wrapper = shallow( <Edit name="core/test-block" /> );

		expect( wrapper.exists( edit ) ).toBe( true );
	} );

	it( 'should use save implementation of block as fallback', () => {
		const save = () => <div />;
		registerBlockType( 'core/test-block', {
			save,
			category: 'common',
			title: 'block title',
		} );

		const wrapper = shallow( <Edit name="core/test-block" /> );

		expect( wrapper.exists( save ) ).toBe( true );
	} );

	it( 'should combine the default class name with a custom one', () => {
		const edit = ( { className } ) => <div className={ className } />;
		const attributes = {
			className: 'my-class',
		};
		registerBlockType( 'core/test-block', {
			edit,
			save: noop,
			category: 'common',
			title: 'block title',
		} );

		const wrapper = shallow(
			<Edit name="core/test-block" attributes={ attributes } />
		);

		expect( wrapper.find( edit ).hasClass( 'wp-block-test-block' ) ).toBe(
			true
		);
		expect( wrapper.find( edit ).hasClass( 'my-class' ) ).toBe( true );
	} );
} );
