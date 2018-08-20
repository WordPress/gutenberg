/**
 * Internal dependencies
 */
import { name, settings } from '../';
import { blockEditRender } from '../../src/test/helpers';

describe( 'core/playlist', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( name, settings );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
