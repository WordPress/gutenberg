/**
 * Internal dependencies
 */
import { registerFreeformBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/freeform', () => {
	beforeAll( () => {
		registerFreeformBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/freeform' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
