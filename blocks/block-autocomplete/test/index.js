/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import BlockIcon from '../../block-icon';
import {
	registerBlockType,
	unregisterBlockType,
} from '../../api';
import BlockAutocomplete from '../';

describe( 'BlockAutocomplete', () => {
	beforeAll( () => {
		registerBlockType( 'core/test-block', {
			title: 'Test Block',
			category: 'common',
			icon: 'format-image',
			keywords: [ 'example' ],
			save() {},
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'core/test-block' );
	} );

	describe( 'onSelect()', () => {
		it( 'calls onReplace callback', () => {
			const onReplace = jest.fn();
			const wrapper = shallow(
				<BlockAutocomplete onReplace={ onReplace } />
			);

			wrapper.simulate( 'select', {
				value: 'core/test-block',
			} );

			expect( onReplace ).toHaveBeenCalled();
			// First argument of first call is the created block
			expect( onReplace.mock.calls[ 0 ][ 0 ].name ).toBe( 'core/test-block' );
		} );
	} );

	describe( 'render()', () => {
		it( 'renders with block options', () => {
			const wrapper = shallow( <BlockAutocomplete /> );

			const options = wrapper.prop( 'options' );
			expect( options ).toHaveLength( 1 );
			expect( options[ 0 ].value ).toBe( 'core/test-block' );
			expect( options[ 0 ].label[ 0 ].type ).toBe( BlockIcon );
			expect( options[ 0 ].label[ 1 ] ).toBe( 'Test Block' );
			expect( options[ 0 ].keywords ).toEqual( [ 'example', 'Test Block' ] );
		} );
	} );
} );
