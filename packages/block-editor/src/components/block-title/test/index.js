/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import BlockTitle from '../';

jest.mock( '@wordpress/blocks', () => {
	return {
		getBlockType( name ) {
			switch ( name ) {
				case 'name-not-exists':
					return null;

				case 'name-exists':
					return { title: 'Block Title' };
			}
		},
	};
} );

jest.mock( '@wordpress/data/src/components/use-select', () => {
	// This allows us to tweak the returned value on each test
	const mock = jest.fn();
	return mock;
} );

describe( 'BlockTitle', () => {
	it( 'renders nothing if name is falsey', () => {
		const wrapper = shallow( <BlockTitle /> );

		expect( wrapper.type() ).toBe( null );
	} );

	it( 'renders nothing if block type does not exist', () => {
		useSelect.mockImplementation( () => 'name-not-exists' );
		const wrapper = shallow(
			<BlockTitle clientId="afd1cb17-2c08-4e7a-91be-007ba7ddc3a1" />
		);

		expect( wrapper.type() ).toBe( null );
	} );

	it( 'renders title if block type exists', () => {
		useSelect.mockImplementation( () => 'name-exists' );
		const wrapper = shallow(
			<BlockTitle clientId="afd1cb17-2c08-4e7a-91be-007ba7ddc3a1" />
		);

		expect( wrapper.text() ).toBe( 'Block Title' );
	} );
} );
