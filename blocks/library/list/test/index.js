/**
 * Internal dependencies
 */
import { registerListBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/list', () => {
	beforeAll( () => {
		registerListBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/list' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
