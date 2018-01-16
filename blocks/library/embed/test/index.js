/**
 * Internal dependencies
 */
import { registerEmbedBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/embed', () => {
	beforeAll( () => {
		registerEmbedBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/embed' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
