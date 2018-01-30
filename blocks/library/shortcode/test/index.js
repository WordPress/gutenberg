/**
 * Internal dependencies
 */
import { name, settings, Shortcode } from '../';
import { blockEditRender } from 'blocks/test/helpers';

settings.edit = Shortcode;
describe( 'core/shortcode', () => {
	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( name, settings );
		expect( wrapper ).toMatchSnapshot();
	} );
} );
