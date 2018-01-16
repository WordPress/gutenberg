/**
 * Internal dependencies
 */
import { registerSeparatorBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/separator', () => {
	beforeAll( () => {
		registerSeparatorBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/separator' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
