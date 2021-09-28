/**
 * External dependencies
 */
import { shallow, mount } from 'enzyme';

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
import { BlockContextProvider } from '../../block-context';

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
			category: 'text',
			title: 'block title',
			edit,
		} );

		const wrapper = shallow( <Edit name="core/test-block" /> );

		expect( wrapper.exists( edit ) ).toBe( true );
	} );

	it( 'should assign context', () => {
		const edit = ( { context } ) => context.value;
		registerBlockType( 'core/test-block', {
			category: 'text',
			title: 'block title',
			usesContext: [ 'value' ],
			edit,
		} );

		const wrapper = mount(
			<BlockContextProvider value={ { value: 'Ok' } }>
				<Edit name="core/test-block" />
			</BlockContextProvider>
		);

		expect( wrapper.html() ).toBe( 'Ok' );
	} );
} );
