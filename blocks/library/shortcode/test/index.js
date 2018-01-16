/**
 * Internal dependencies
 */
import { registerShortcodeBlock } from '../';
import { blockEditRender } from 'blocks/test/helpers';

describe( 'core/shortcode', () => {
	beforeAll( () => {
		registerShortcodeBlock();
	} );

	test( 'block edit matches snapshot', () => {
		const wrapper = blockEditRender( 'core/shortcode' );

		expect( wrapper ).toMatchSnapshot();
	} );
} );
