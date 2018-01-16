/**
 * Internal dependencies
 */
import { registerCodeBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/code', () => {
	beforeAll( () => {
		registerCodeBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/code' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
