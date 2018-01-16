/**
 * Internal dependencies
 */
import { registerHeadingBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/heading', () => {
	beforeAll( () => {
		registerHeadingBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/heading' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
