/**
 * Internal dependencies
 */
import { registerMoreBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/more', () => {
	beforeAll( () => {
		registerMoreBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/more' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
