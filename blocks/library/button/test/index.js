/**
 * Internal dependencies
 */
import { registerButtonBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/button', () => {
	beforeAll( () => {
		registerButtonBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/button' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
