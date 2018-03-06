/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { BlockEdit } from '../';
import {
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '../../api';

describe( 'BlockEdit', () => {
	afterEach( () => {
		getBlockTypes().forEach( ( block ) => {
			unregisterBlockType( block.name );
		} );
	} );

	it( 'should return null if block type not defined', () => {
		const wrapper = shallow( <BlockEdit name="core/test-block" /> );

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

		const wrapper = shallow( <BlockEdit name="core/test-block" /> );

		expect( wrapper.type() ).toBe( edit );
	} );

	it( 'should use save implementation of block as fallback', () => {
		const save = () => <div />;
		registerBlockType( 'core/test-block', {
			save,
			category: 'common',
			title: 'block title',
		} );

		const wrapper = shallow( <BlockEdit name="core/test-block" /> );

		expect( wrapper.type() ).toBe( save );
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
			<BlockEdit name="core/test-block" attributes={ attributes } />
		);

		expect( wrapper.prop( 'className' ) ).toBe( 'wp-block-test-block my-class' );
	} );
} );
