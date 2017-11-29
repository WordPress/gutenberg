/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import BlockEdit from '../';
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

		expect( wrapper.first().type() ).toBe( null );
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

		expect( wrapper.first().type() ).toBe( edit );
	} );

	it( 'should use save implementation of block as fallback', () => {
		const save = () => <div />;
		registerBlockType( 'core/test-block', {
			save,
			category: 'common',
			title: 'block title',
		} );

		const wrapper = shallow( <BlockEdit name="core/test-block" /> );

		expect( wrapper.first().type() ).toBe( save );
	} );
} );
