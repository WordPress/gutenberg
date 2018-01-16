/**
 * Internal dependencies
 */
import { registerTextColumnsBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/text-columns', () => {
	beforeAll( () => {
		registerTextColumnsBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/text-columns' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
